const fs = require("fs")
const content = fs.readFileSync("src/App.tsx", "utf-8")
const promptStart = content.indexOf("function PermissionsPrompt")
if (promptStart > -1) {
  const promptEnd = content.lastIndexOf("}") + 1 // Assuming it's at the very end
  const promptCode = content.substring(promptStart, promptEnd)
  const withoutPrompt = content.substring(0, promptStart)

  const appStart = withoutPrompt.indexOf("export default function App")

  const finalCode =
    withoutPrompt.substring(0, appStart) +
    "\n" +
    promptCode +
    "\n\n" +
    withoutPrompt.substring(appStart)

  fs.writeFileSync("src/App.tsx", finalCode)
  console.log("Rewritten")
}
