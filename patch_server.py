import re, sys

filepath = './server/_core/index.ts'

with open(filepath, 'r') as f:
    content = f.read()

# 1. Find the insertion point (right before app.listen / server.listen)
listen_match = re.search(r'^\s*(?:app|server)\.listen\(', content, re.MULTILINE)
if not listen_match:
    print("ERROR: Could not find app.listen or server.listen")
    sys.exit(1)
insert_pos = listen_match.start()

# 2. Try to find the existing router call for chat.complete
# Look for a line that calls .complete({ messages... }) inside any function
router_call_pattern = r'(?:const|let|var)\s+\w+\s*=\s*await\s+(\S+\.complete\(\s*\{\s*messages)'
match = re.search(router_call_pattern, content)
if match:
    # Extract the start of the call, e.g., "hybridRouter.complete({ messages"
    call_start = match.group(1)
    # Complete the call with variables we'll pass
    router_call = call_start + ', taskType, provider: model });'
else:
    # Fallback: assume a global hybridRouter
    router_call = 'hybridRouter.complete({ messages, taskType, provider: model });'

# 3. Build the new endpoint code
new_code = f'''
// OpenAI-compatible endpoint for coding tools
app.post('/v1/chat/completions', async (req, res) => {{
  try {{
    const {{ messages, model }} = req.body;
    let taskType = 'coding';
    if (model?.includes('gpt-4')) taskType = 'chat';
    const result = await {router_call}
    res.json({{
      id: 'forge-' + Date.now(),
      object: 'chat.completion',
      created: Date.now(),
      model: model || 'freeapi-forge',
      choices: [{{
        index: 0,
        message: {{
          role: 'assistant',
          content: result.content,
        }},
        finish_reason: 'stop',
      }}],
      usage: {{
        prompt_tokens: result.usage?.prompt_tokens,
        completion_tokens: result.usage?.completion_tokens,
        total_tokens: result.usage?.total_tokens,
      }},
    }});
  }} catch (err: any) {{
    res.status(500).json({{ error: err.message }});
  }}
}});
'''

# 4. Insert before the listen call
updated = content[:insert_pos] + new_code + '\n' + content[insert_pos:]

with open(filepath, 'w') as f:
    f.write(updated)

print("✅ Endpoint added. Router call used:", router_call)
