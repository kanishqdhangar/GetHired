import google.generativeai as genai
genai.configure(api_key="AIzaSyBwb8k_PCKo94gwwL9dE12ZtHfVKJQCpt8")

response = genai.embed_content(model="models/embedding-001", content="Machine learning and data analysis")
print(len(response["embedding"]))
