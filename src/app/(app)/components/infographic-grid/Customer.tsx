'use client'

export default function Customer({ beamPosition, mounted = false }: { beamPosition: number, mounted?: boolean }) {
  const phoneActive = beamPosition >= 12 && beamPosition < 20
  
  return (
    <div className="relative">
      {/* Phone with notification */}
      {mounted && (
        <div 
          className="absolute transition-opacity duration-500"
          style={{
            right: '50px',
            top: '10px',
            zIndex: 10,
            transform: 'rotate(-10deg)',
            opacity: beamPosition >= 10 && beamPosition < 20 ? 1 : 0.3
          }}
        >
          <div 
            className="relative"
            style={{
              width: '28px',
              height: '48px',
              background: phoneActive 
                ? 'linear-gradient(135deg, #fde047, #f9a8d4, #c084fc)'
                : 'rgba(253, 224, 71, 0.15)',
              borderRadius: '4px',
              border: phoneActive
                ? '1px solid rgba(249, 168, 212, 0.8)'
                : '1px solid rgba(249, 168, 212, 0.2)',
              backdropFilter: 'blur(2px)',
              boxShadow: phoneActive
                ? '0 0 15px rgba(249, 168, 212, 0.5)'
                : 'none',
              animation: phoneActive ? 'pulse 1s ease-in-out 2' : 'none'
            }}
          >
            <div style={{
              position: 'absolute',
              inset: '2px',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '2px'
            }} />
            
            {/* SMS bubble */}
            {beamPosition >= 14 && beamPosition < 20 && (
              <div className="absolute" style={{
                bottom: '4px',
                left: '3px',
                right: '3px',
                height: '8px',
                background: 'rgba(249, 168, 212, 0.8)',
                borderRadius: '5px 5px 5px 2px',
                animation: 'fadeIn 0.3s ease-out'
              }} />
            )}
          </div>
        </div>
      )}
      
      {/* Customer SVG */}
      <div className="relative">
        <div className="absolute inset-0 blur-2xl bg-gradient-to-r from-yellow-300/20 via-pink-300/20 to-purple-300/20 scale-105" />
        
        <svg width="200" height="200" viewBox="0 0 107.4084 230.4448" className="relative" 
          style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))', marginTop: '20px' }}>
          <defs>
            <linearGradient id="customerGradientGrid" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="50%" stopColor="#f9a8d4" />
              <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>
          </defs>
          <path fill="url(#customerGradientGrid)" d="M86.8651,120.29c0.2493,3.3261,0.4326,6.7546,0.5295,10.2818c0.0967,3.5278,2.9863,6.3218,6.4941,6.3218c0.0596,0,0.1201-0.001,0.1816-0.0024c3.5879-0.0986,6.417-3.0874,6.3184-6.6758c-0.0791-2.8838-0.215-5.6995-0.3913-8.4558L86.8651,120.29z"/>
          <path fill="url(#customerGradientGrid)" d="M55.6787,93.978c8.54-10.8865,16.5322-32.6918,18.0428-36.9388L64.753,49.157C63.4044,68.7402,57.928,87.1077,55.6787,93.978z"/>
          <path fill="url(#customerGradientGrid)" d="M20.545,120.2898l-13.1342,1.4698c-0.1763,2.7563-0.3122,5.572-0.3913,8.4557c-0.0986,3.5884,2.7305,6.5771,6.3184,6.6758c0.0615,0.0015,0.1211,0.0024,0.1816,0.0024c3.5078,0,6.3975-2.7939,6.4941-6.3218C20.1104,127.0464,20.2944,123.6177,20.545,120.2898z"/>
          <path fill="url(#customerGradientGrid)" d="M42.6562,49.1567l-8.9698,7.8824c1.5109,4.2474,9.5044,26.056,18.0451,36.9417C49.4828,87.1129,44.005,68.7428,42.6562,49.1567z"/>
          <path fill="url(#customerGradientGrid)" d="M53.7041,119.4738c-4.4898,6.3796-13.8355,17.17-28.4952,22.5884l-8.0527,77.346c-0.5723,5.4932,3.418,10.4102,8.9111,10.9819c0.3516,0.0366,0.7012,0.0547,1.0469,0.0547c5.0576,0,9.3994-3.8242,9.9346-8.9653l8.23-79.0486c3.3999-5.8443,6.5693-7.6791,8.4272-7.6791c1.8599,0,5.0356,1.84,8.4404,7.702l8.2266,79.0257c0.5352,5.1411,4.876,8.9653,9.9336,8.9653c0.3467,0,0.6963-0.0181,1.0479-0.0547c5.4932-0.5718,9.4834-5.4888,8.9111-10.9819l-8.0513-77.3405C67.5461,136.6509,58.1954,125.8555,53.7041,119.4738z"/>
          <path fill="url(#customerGradientGrid)" d="M75.2042,21.5c0-11.8741-9.6259-21.5-21.5-21.5s-21.5,9.6259-21.5,21.5S41.83,43,53.7042,43S75.2042,33.3741,75.2042,21.5zM43.5609,28.9776h20.2866c-2.1021,3.405-5.8566,5.6864-10.1433,5.6864C49.4175,34.664,45.663,32.3826,43.5609,28.9776z"/>
          <path fill="url(#customerGradientGrid)" d="M20.9206,115.8874c1.8389-19.2365,5.8632-34.588,8.7068-43.5957c2.4692,7.2062,2.8541,15.2776,2.2819,20.9247c-0.8779,8.6638-2.0297,12.9877-3.2631,19.8423l-8.6337,28.2557c17.5688-4.7244,28.2902-17.9381,32.6051-24.3477h2.173c4.3149,6.4095,15.0363,19.6233,32.6051,24.3477l-8.6273-28.2347c-1.2382-6.8668-2.3868-11.1906-3.2661-19.8633c-0.5723-5.65-0.1849-13.7266,2.2858-20.9357c2.8445,8.9873,6.8666,24.3163,8.7029,43.607l14.8189,1.6583l1.2357-1.7984l4.8627-7.0771l-5.8241-1.8335l-3.1509-0.9919C94.6817,77.592,87.03,59.306,86.623,58.3491c-0.7085-1.6642-2.0288-2.8789-3.5864-3.4966c-2.2582-1.3129-7.136-3.749-14.4139-5.3561l7.7795,6.8362l-0.25,0.7285C75.743,58.254,66.0116,86.4,55.6024,97.6198c-0.2266,0.2441-0.5342,0.3677-0.8428,0.3677c-0.2803,0-0.5605-0.1016-0.7822-0.3066c-0.1241-0.1152-0.212-0.2526-0.2734-0.3991c-0.0615,0.1465-0.1493,0.2839-0.2734,0.3991c-0.2217,0.2051-0.502,0.3066-0.7822,0.3066c-0.3086,0-0.6162-0.1235-0.8428-0.3677C41.3964,86.4,31.6649,58.254,31.2557,57.0612l-0.25-0.7285l7.7792-6.8354c-7.2691,1.6057-12.1429,4.0382-14.4036,5.3517c-1.562,0.6167-2.8862,1.8328-3.5962,3.5001c-0.407,0.9568-8.0587,19.2429-11.8104,47.496l-3.1509,0.9919L0,108.6705l4.8625,7.0768l1.2359,1.7986L20.9206,115.8874z"/>
        </svg>
      </div>
      
      <div className="text-center mt-5">
        <h3 className="text-white/95 font-bold text-lg">Customer</h3>
        <p className="text-gray-200/90 text-sm mt-1 max-w-[240px] mx-auto">
          Share Prompt Pages by QR Code, SMS, Email, or NFC chip.
        </p>
      </div>
    </div>
  )
}