import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Pages WITHOUT navbar / layout
  const authPages = ["/login", "/register"];

  if (authPages.includes(router.pathname)) {
    return <Component {...pageProps} />;
  }

  return <Component {...pageProps} />;
}
