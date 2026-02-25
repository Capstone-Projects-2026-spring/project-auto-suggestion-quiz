import os
import time
from dotenv import load_dotenv
from openai import OpenAI

# This loads the variables from your .env file into the environment
load_dotenv()

# The client will now automatically find the key from your .env file
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Define the chat completion request
completion = client.chat.completions.create(
    model="gpt-4o",  # Or your preferred model (e.g., gpt-4o-mini)
    messages=[
        {"role": "system", "content": "You are a helpful and concise programming assistant specialized in python."},
        {"role": "user", "content": "give me a suggestion for the next line of this code: def print_hello(); print('hello world')"}
    ]
)

# Extract and print the response
print(completion.choices[0].message.content)