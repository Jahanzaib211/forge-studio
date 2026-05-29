import re

filepath = '/home/jahanzaib/freeapi-forge/server/_core/index.ts'

with open(filepath, 'r') as f:
    lines = f.readlines()

# 1. Find the incorrectly placed block (from comment to closing `});` just before `server.listen`)
start_comment = '// OpenAI-compatible endpoint for coding tools\n'
try:
    start_idx = lines.index(start_comment)
except ValueError:
    # maybe already moved or no longer present
    start_idx = None

if start_idx is not None:
    # Find next line containing `server.listen` after start_idx
    end_idx = None
    for i in range(start_idx+1, len(lines)):
        if 'server.listen(port, () => {' in lines[i] or 'server.listen(' in lines[i]:
            # go backwards to find `  });` which closes our endpoint
            for j in range(i-1, start_idx, -1):
                if lines[j].strip() == '});':
                    end_idx = j
                    break
            break
    if end_idx is None:
        end_idx = start_idx + 37  # fallback line count of block
    # Remove the block
    del lines[start_idx:end_idx+1]
    # remove extra newline that might remain
else:
    print("Block not found (maybe already moved)")

# 2. Find insertion point: line `const preferredPort = ...` inside startServer
insert_line = '  const preferredPort = parseInt(process.env.PORT || "5051");\n'
if insert_line in lines:
    idx = lines.index(insert_line)
else:
    # fallback: search for substring
    idx = None
    for i, line in enumerate(lines):
        if 'preferredPort = parseInt(process.env.PORT' in line:
            idx = i
            break

if idx is None:
    print("ERROR: Could not find preferredPort line")
    exit(1)

# 3. Build the endpoint code (proper indentation)
new_block = """  // OpenAI-compatible endpoint for coding tools
  app.post('/v1/chat/completions', async (req, res) => {
    try {
      const { messages, model } = req.body;
      let taskType = 'coding';
      if (model?.includes('gpt-4')) taskType = 'chat';
      const result = await hybridRouter.complete({ messages, taskType, provider: model });
      res.json({
        id: 'forge-' + Date.now(),
        object: 'chat.completion',
        created: Date.now(),
        model: model || 'freeapi-forge',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: result.content,
          },
          finish_reason: 'stop',
        }],
        usage: {
          prompt_tokens: result.usage?.prompt_tokens,
          completion_tokens: result.usage?.completion_tokens,
          total_tokens: result.usage?.total_tokens,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

"""

# Insert before preferredPort
lines.insert(idx, new_block)

with open(filepath, 'w') as f:
    f.writelines(lines)

print("✅ Endpoint moved inside startServer()")
