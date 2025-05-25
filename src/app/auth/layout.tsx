import Head from 'next/head';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Head>
        <link rel="stylesheet" href="https://promptreviews.app/wp-content/themes/astra/assets/css/minified/main.min.css?ver=4.11.1" />
      </Head>
      <div className="min-h-screen">
        {children}
      </div>
    </>
  );
} 