with open(r'C:\ai-agent\backend\main.py', 'r', encoding='utf-8') as f:
    content = f.read()

old = '''        if agent_state.should_summarize():
            # In a production system, we'd async summarize the conversation
            # For now, just log that summarization would occur
            logger.info(f"[Agent] Session {session_key} eligible for memory summarization")'''

new = '''        if agent_state.should_summarize():
            try:
                messages_text = "\\n".join(
                    f"{m['sender'].upper()}: {m['content']}"
                    for m in agent_state.short_term_memory
                )
                summary = await ai_fallback_wrapper.summarize(messages_text)
                agent_state.update_long_term_memory(summary)
                agent_state.short_term_memory = agent_state.short_term_memory[-2:]
                logger.info(f"[Agent] Memory summarized for session {session_key}")
            except Exception as sum_err:
                logger.warning(f"[Agent] Memory summarization failed: {sum_err}")'''

if old in content:
    content = content.replace(old, new)
    with open(r'C:\ai-agent\backend\main.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Memory summarization fixed')
else:
    print('Pattern not found')
