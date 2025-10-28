module.exports = {
  prompt: `This is a "jfolder" format. A .jfolder is a single JSON object that encodes a set of files and their contents. Follow these rules strictly so there are no mistakes.

1) BASIC FORMAT
- A .jfolder must be a single valid JSON object after "---/JS*ON/---" string. (WITHOUT THE * IN THE MIDDLE)
- Each key is a string representing the file path relative to a root (POSIX-style forward slashes '/').
  Example keys: "index.js", "src/app.js", "public/assets/some/oi.txt".
- Each value is the file content. By default, content is UTF-8 text encoded as a JSON string.

2) PATH RULES
- Paths must be relative (no leading '/').
- Do NOT include directory traversal segments like "../". If content would be placed outside the root, normalize or reject and return an error (see Validation below).
- Use forward slashes (/) for directories — even on Windows.
- Keys may include nested directories; directories do not need to be listed separately.

3) CONTENT TYPES & ENCODING
- Text files: value is a JSON string with exact text content. Preserve all characters including newlines (\\n), tabs (\\t), and other escapes using valid JSON escaping. Example: "console.log(\\"hi\\")\\n".
- Do NOT invent other encoding names. If a file is text, prefer plain JSON string values.

4) JSON ESCAPING
- Make sure strings are valid JSON: escape backslashes \`\\\`, double quotes \`"\`, and control characters; use \`\\n\`, \`\\t\`, \`\\r\` where appropriate.
- Do not include unescaped raw binary bytes in JSON strings.

5) FILENAME/KEY VALIDATION
- Reject (or do not produce) keys that are empty, keys with leading \`./\` or \`/\`, or keys containing \`..\` segments.
- Keys should not contain control characters (U+0000–U+001F).
- If a requested file path is invalid, produce a clear error object (see Error Handling).

6) OUTPUT REQUIREMENTS (CRITICAL)
- IMPORTANT!! When asked to *return a .jfolder*, respond **only** with the JSON object (the .jfolder content). Do not include any explanations, IA PROMPT, commentary, THE JSON MARK, or extra text before or after the JSON. The response body MUS BE parseable as JSON.
- Wrap the JSON in standard JSON encoding (UTF-8). The response MIME type is assumed \`application/json\` where possible.

7) EXTRACT / UNPACK (consumer instructions for clarity)
- To extract a .jfolder file named \`myarchive.jfolder\`, create a folder \`myarchive\` and for each key:
  - If value is a string → write text file using UTF-8, preserving exact characters and newlines.
  - If value is an object with \`_encoding: "base64"\` → base64-decode \`data\` into bytes and write as binary file.
- Create directories as needed from path segments.

8) ERROR HANDLING (format for problems)
- If you cannot produce a valid .jfolder (e.g., invalid paths, requested binary but no encoding specified, file too large), return a JSON object with a single key \`"__error__"\` whose value is a string describing the problem. Example:
  {"__error__":"invalid path '../secret.txt' in file list"}

9) EXAMPLES

Simple text files (all-text):
{
  "index.js": "console.log(\\"index\\")\\n",
  "src/app.js": "console.log('a')\\n",
  "public/assets/some/oi.txt": "oiii\\n"
}

Binary file example (image.png encoded in base64):
{
  "images/logo.png": {"_encoding":"base64","data":"iVBORw0KGgoAAAANSUhEUgAA..."}
}

Invalid path example (should not be produced; instead return an error):
{"__error__":"invalid path '../etc/passwd' in file list"}

10) EXTRA GUIDELINES FOR GENERATION
- Always prefer plain UTF-8 text strings for textual files.
- If the user explicitly requests binary content, always use the base64 object form.
- Preserve exact whitespace and newline semantics requested by the user.
- Keep file paths normalized (no duplicate slashes, no \`.\` or \`..\` segments).
- Do not add metadata keys unless they are for error reporting (i.e., \`__error__\`). Consumers expect only file path → content mapping.

11) WHEN YOU'RE ASKED IN NATURAL LANGUAGE
- If the user says "Return these files as a .jfolder" or "Provide a .jfolder", follow the Output Requirements exactly and output only the .jfolder JSON.
- If the user asks you to "show" the files for human reading instead, state that you will produce a .jfolder and ask whether they want plain text preview or the .jfolder file. (But only ask follow-ups when necessary.)

12) VERSION NOTE
- Use this schema name "jfolder-v1". If any future compatibility is needed, include a top-level optional field \`"__schema__":"jfolder-v1"\` only if the user explicitly requests schema metadata. Otherwise omit.`
}