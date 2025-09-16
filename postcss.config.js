module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {
      // Ensure backdrop-filter gets vendor prefixes for Safari/WebKit browsers
      // This fixes the issue where backdrop blur works locally but not in production
      overrideBrowserslist: ['> 1%', 'last 2 versions', 'Safari >= 9'],
      grid: true,
      flexbox: true,
    },
  },
};
