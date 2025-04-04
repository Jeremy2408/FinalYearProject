import ctypes
import os
import numpy as np

lib_path = os.path.join(os.path.dirname(__file__), "libemotion_stability.so")

print("Resolved lib path:", lib_path)

# Load the shared library
lib = ctypes.CDLL(lib_path)

# Define the C++ function signature for ctypes
lib.calculate_stability.argtypes = [ctypes.POINTER(ctypes.c_int), ctypes.c_int]
lib.calculate_stability.restype = ctypes.c_float

def calculate_emotion_stability(scores: list[int]) -> float:
    
    # Convert to a C array of integers
    array_type = ctypes.c_int * len(scores)
    c_array = array_type(*scores)

    result = lib.calculate_stability(c_array, len(scores))
    return float(result)

if __name__ == "__main__":
    mood_scores = [1, 7, 1, 7, 1]
    score = calculate_emotion_stability(mood_scores)
    print(f"Emotion Stability Index: {score:.2f}")