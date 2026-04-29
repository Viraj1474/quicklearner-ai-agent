"""Test quiz generation"""
import asyncio
import json

async def test_quiz():
    from advanced_quiz_generator import advanced_quiz_generator
    
    print("Generating quiz...")
    result = await advanced_quiz_generator.generate_advanced_quiz(
        topic="Python decorators",
        num_questions=5,
        difficulty="medium",
        question_types=["multiple_choice", "true_false", "short_answer", "fill_in_blank"],
        with_hints=True,
        with_explanations=True
    )
    
    print(f"\nGenerated {result.get('total_questions', 0)} questions")
    print(f"Total points: {result.get('total_points', 0)}")
    print(f"Error: {result.get('error', 'None')}")
    
    for i, q in enumerate(result.get('questions', [])):
        print(f"\n--- Question {i+1} ---")
        print(f"Type: {q.get('type')}")
        print(f"Difficulty: {q.get('difficulty')}")
        print(f"Question: {q.get('question', '')[:120]}...")
        if q.get('options'):
            print(f"Options: {list(q.get('options', {}).keys())}")
        print(f"Correct: {q.get('correct_answer', q.get('model_answer', '')[:50] if q.get('model_answer') else 'N/A')}")
        print(f"Hints: {len(q.get('hints', []))} available")
    
    return result

if __name__ == "__main__":
    asyncio.run(test_quiz())
