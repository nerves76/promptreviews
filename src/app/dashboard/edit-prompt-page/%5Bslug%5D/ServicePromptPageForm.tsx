import { FALLING_STARS_ICONS } from '@/app/components/prompt-modules/fallingStarsConfig';

{FALLING_STARS_ICONS.map(opt => {
  const Icon = opt.icon;
  return (
    <button
      key={opt.key}
      className={`p-2 rounded-full border transition bg-white flex items-center justify-center ${fallingIcon === opt.key ? 'border-slate-blue ring-2 ring-slate-blue' : 'border-gray-300'}`}
      onClick={() => setFallingIcon(opt.key)}
      aria-label={opt.label}
      type="button"
      disabled={iconUpdating || !fallingEnabled}
    >
      <Icon className={
        opt.key === 'star' ? 'w-6 h-6 text-yellow-400' :
        opt.key === 'heart' ? 'w-6 h-6 text-red-500' :
        opt.key === 'smile' ? 'w-6 h-6 text-yellow-400' :
        opt.key === 'thumb' ? 'w-6 h-6 text-blue-500' :
        opt.key === 'bolt' ? 'w-6 h-6 text-amber-400' :
        opt.key === 'rainbow' ? 'w-6 h-6 text-fuchsia-400' :
        opt.key === 'coffee' ? 'w-6 h-6 text-amber-800' :
        opt.key === 'wrench' ? 'w-6 h-6 text-gray-500' :
        opt.key === 'confetti' ? 'w-6 h-6 text-pink-400' :
        opt.key === 'barbell' ? 'w-6 h-6 text-gray-600' :
        opt.key === 'flower' ? 'w-6 h-6 text-green-500' :
        opt.key === 'peace' ? 'w-6 h-6 text-purple-500' :
        'w-6 h-6'
      } />
    </button>
  );
})} 