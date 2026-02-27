import os
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI

def ai_suggestion( currentCode,  problemPrompt):

    # This loads the variables from your .env file into the environment
    load_dotenv()

    # The client will now automatically find the key from your .env file
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    class CodeResponse(BaseModel):
        suggestion: str
        explanation: str

    # Define the chat completion request
    completion = client.chat.completions.parse(
        model="gpt-4o",  # Or your preferred model (e.g., gpt-4o-mini)
        messages=[
            {"role": "system", "content": "You are a helpful and concise programming assistant specialized in python. Only give next line suggestions. You are going to assist the user in finishing this problem. "+problemPrompt},
            {"role": "user", "content": "give me a suggestion for the next line of this code: "+ currentCode}
        ],
        response_format=CodeResponse,
    )

    # Access the structured data
    result = completion.choices[0].message.parsed
    return result

test = ai_suggestion("def add_numbers(a,b):","create a function that adds 2 numbers together")
print(f"Code: {test.suggestion}")
print(f"Explanation: {test.explanation}")