import { NextResponse } from 'next/server'

export async function GET() {
  const embedScript = `
(function() {
  // Create iframe container
  var container = document.getElementById('promptreviews-infographic');
  if (!container) {
    console.error('PromptReviews Infographic: Container element with id "promptreviews-infographic" not found');
    return;
  }

  // Create iframe
  var iframe = document.createElement('iframe');
  iframe.src = '${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/infographic/embed';
  iframe.style.width = '100%';
  iframe.style.minHeight = '800px';
  iframe.style.border = 'none';
  iframe.style.overflow = 'hidden';
  iframe.setAttribute('scrolling', 'no');
  
  // Clear container and append iframe
  container.innerHTML = '';
  container.appendChild(iframe);

  // Adjust iframe height based on content
  window.addEventListener('message', function(event) {
    // Verify origin for security
    if (event.origin !== '${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}') return;
    
    if (event.data.type === 'infographic-resize' && event.data.height) {
      iframe.style.height = event.data.height + 'px';
    }
  });
})();
`

  return new NextResponse(embedScript, {
    headers: {
      'Content-Type': 'application/javascript',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600'
    }
  })
}