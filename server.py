from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json

# Import the existing optimization functions
from main import solve_with_milp_multiple, generate_piece_types, STAT_NAMES, calculate_actual_stats, CLASS_ITEM_ROLLS

app = FastAPI(title="D2 Stat Tuner API", version="1.0.0")

# Add CORS middleware to allow requests from the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StatRequest(BaseModel):
    Health: int
    Melee: int  
    Grenade: int
    Super: int
    Class: int
    Weapons: int
    allow_tuned: bool = True  # Default to allowing +5/-5 tuning for backward compatibility
    use_exotic: bool = False  # Default to no exotic armor
    use_class_item_exotic: bool = False  # Default to regular exotic if exotic is enabled
    exotic_perks: Optional[List[str]] = None  # List of 2 perk names for exotic class item

class PieceInfo(BaseModel):
    arch: str
    tertiary: str
    tuning_mode: str  # "none", "tuned", "balanced"
    mod_target: str
    tuned_stat: Optional[str] = None
    siphon_from: Optional[str] = None

class Solution(BaseModel):
    pieces: Dict[str, int]  # JSON string key -> count
    deviation: float
    actualStats: Optional[List[int]] = None

class OptimizeResponse(BaseModel):
    solutions: List[Solution]
    message: str

@app.get("/")
async def root():
    return {"message": "D2 Stat Tuner API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/optimize", response_model=OptimizeResponse)
async def optimize_stats(request: StatRequest):
    try:
        # Convert request to the format expected by the optimization function
        desired_totals = [
            request.Health,
            request.Melee, 
            request.Grenade,
            request.Super,
            request.Class,
            request.Weapons
        ]
        
        # Validate exotic perk combination if using exotic class item
        exotic_perks_tuple = None
        if request.use_exotic and request.use_class_item_exotic:
            if not request.exotic_perks or len(request.exotic_perks) != 2:
                raise HTTPException(status_code=400, detail="exotic_perks must be a list of exactly 2 perk names when using exotic class item")
            
            exotic_perks_tuple = tuple(request.exotic_perks)
            if exotic_perks_tuple not in CLASS_ITEM_ROLLS:
                available_combinations = list(CLASS_ITEM_ROLLS.keys())
                raise HTTPException(
                    status_code=400, 
                    detail=f"Invalid exotic perk combination: {exotic_perks_tuple}. Available combinations: {available_combinations}"
                )
        
        # Generate piece types and their stats (this might take a moment on first run)
        piece_types, piece_stats = generate_piece_types(
            allow_tuned=request.allow_tuned,
            use_exotic=request.use_exotic,
            use_class_item_exotic=request.use_class_item_exotic,
            exotic_perks=exotic_perks_tuple
        )
        
        # Run the optimization with 2-minute total timeout
        solutions_list, deviations_list = solve_with_milp_multiple(
            desired_totals, 
            piece_types, 
            piece_stats, 
            max_solutions=5, 
            allow_tuned=request.allow_tuned,
            require_exotic=request.use_exotic,
            total_timeout=30  # 30 seconds for approximations
        )
        
        if not solutions_list:
            return OptimizeResponse(
                solutions=[],
                message="No solutions found for the given stat requirements"
            )
        
        # Convert solutions to the format expected by the frontend
        formatted_solutions = []
        for sol, deviation in zip(solutions_list, deviations_list):
            # Convert piece types to JSON strings for frontend consumption
            pieces_dict = {}
            
            for piece_type, count in sol.items():
                # Convert PieceType namedtuple to dict then to JSON string
                piece_dict = {
                    'arch': piece_type.arch,
                    'tertiary': piece_type.tertiary,
                    'tuning_mode': piece_type.tuning_mode,
                    'mod_target': piece_type.mod_target,
                    'tuned_stat': piece_type.tuned_stat,
                    'siphon_from': piece_type.siphon_from
                }
                pieces_dict[json.dumps(piece_dict)] = count
            
            # Calculate actual stats achieved by this solution
            actual_stats = calculate_actual_stats(sol, piece_stats)
            
            formatted_solutions.append(Solution(
                pieces=pieces_dict,
                deviation=float(deviation),
                actualStats=actual_stats
            ))
        
        return OptimizeResponse(
            solutions=formatted_solutions,
            message=f"Found {len(formatted_solutions)} optimal solution(s)"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")

@app.get("/stats/info")
async def get_stats_info():
    """Get information about the stat system"""
    return {
        "stat_names": STAT_NAMES,
        "max_possible_total": 515,  # 5 pieces * 103 max per piece (with balanced tuning)  
        "description": "Destiny 2 has 6 stats that can be optimized through armor selection and modding"
    }

@app.get("/exotic/perks")
async def get_exotic_perks():
    """Get available exotic class item perk combinations"""
    return {
        "available_combinations": list(CLASS_ITEM_ROLLS.keys()),
        "class_item_rolls": CLASS_ITEM_ROLLS,
        "description": "Available perk combinations for exotic class items"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")