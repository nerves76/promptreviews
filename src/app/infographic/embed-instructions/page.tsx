export default function EmbedInstructionsPage() {
  const embedCode = `<!-- PromptReviews Animated Infographic -->
<div id="promptreviews-infographic"></div>
<script src="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/api/infographic-widget"></script>`

  const iframeCode = `<iframe 
  src="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/infographic/embed"
  width="100%" 
  height="800" 
  frameborder="0"
  style="border: none; overflow: hidden;"
></iframe>`

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Embed the PromptReviews Infographic</h1>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Method 1: JavaScript Widget (Recommended)</h2>
          <p className="text-gray-600 mb-4">
            This method automatically adjusts height and provides the best user experience.
          </p>
          <div className="bg-gray-100 p-4 rounded-lg">
            <pre className="overflow-x-auto text-sm">
              <code>{embedCode}</code>
            </pre>
          </div>
          <button 
            onClick={() => navigator.clipboard.writeText(embedCode)}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Copy Code
          </button>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Method 2: Direct iframe</h2>
          <p className="text-gray-600 mb-4">
            Use this if you prefer a simple iframe embed without JavaScript.
          </p>
          <div className="bg-gray-100 p-4 rounded-lg">
            <pre className="overflow-x-auto text-sm">
              <code>{iframeCode}</code>
            </pre>
          </div>
          <button 
            onClick={() => navigator.clipboard.writeText(iframeCode)}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Copy Code
          </button>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Customization Options</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Minimum recommended width: 320px (mobile-responsive)</li>
            <li>Recommended height: 800px or use auto-resize with JS widget</li>
            <li>The infographic adapts to container width automatically</li>
            <li>Dark background recommended for best visual effect</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Preview</h2>
          <div className="border-2 border-gray-300 rounded-lg p-4">
            <iframe 
              src="/infographic/embed"
              width="100%" 
              height="800" 
              frameBorder="0"
              style={{ border: 'none', overflow: 'hidden' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}