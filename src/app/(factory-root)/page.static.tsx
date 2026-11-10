import { getStaticSite } from "@/lib/static-site";

// "/" simply forwards visitors to the site's default language.
export default function Root() {
  const lang = getStaticSite().defaultLang;
  return (
    <>
      <meta httpEquiv="refresh" content={`0;url=${lang}/`} />
      <p>
        <a href={`${lang}/`}>Continue</a>
      </p>
    </>
  );
}
