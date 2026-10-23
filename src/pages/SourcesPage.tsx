import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CAUTION_TEXT } from '../components/SiteFooter'
import { useI18n } from '../i18n'

export function SourcesPage() {
  const { t } = useI18n()
  return (
    <main className="content-page narrow page-with-nav">
      <Link className="back-link" to="/library"><ArrowLeft size={17} /> {t('The collection')}</Link>
      <header className="page-heading">

        <h1>{t('Sources & credits')}</h1>
        <p>{t('Every reading must keep its text, translation, and license attached to the source that supplied it.')}</p>
      </header>
      <section className="source-status"><h2>{t('Riyad as-Salihin · Arabic')}</h2><p>{t('Arabic text and original chapter order are sourced from IslamHouse.com / IslamEnc.com. The app preserves the source wording and reference numbering; only the page layout is reflowed for reading.')}</p></section>
      <section className="source-status"><h2>{t('English translation')}</h2><p>{t('The published English text is from IslamHouse.com / IslamEnc.com and is paired by the source’s hadith reference. Some narrations may not have an English entry; those remain Arabic-only and are never filled with generated text.')}</p></section>
      <section className="source-status">
        <h2>{t("Urdu \u00b7 matching narrations")}</h2>
        <p>{t("Available Urdu text is from HadeethEnc.com\u2019s published matching narrations, not a complete Urdu edition of Riyad as-Salihin. Only unambiguous full-Arabic wording matches are included. The Urdu text is unchanged; additional wording in the Riyad edition may differ. Each translation identifies its edition and includes its corresponding source Arabic. Other entries show an unavailable notice. Translations are not reviewed by this app\u2019s team.")}</p>
        <p><a href="https://hadeethenc.com/ur/home">{t("Publisher and content-use terms")}</a></p>
      </section>
      <section className="source-status"><h2>{t('Ayah of the day')}</h2><p>{t('Daily Quranic Arabic and English/Urdu meanings are provided by QuranEnc.com. The app preserves the API text and footnotes; source edition, translator, version and retrieval date are bundled with each build. The selection rotates every six hours.')}</p></section>
      <section className="source-status"><h2>{t('The Quran reader')}</h2><p>{t('The reader includes Noor International, Rowwad, and Hilali & Khan in English; Muhammad Junagarhi and Fateh Muhammad Jalandhry in Urdu; and Muhiuddin Khan in Bengali. QuranEnc and Tanzil text, editions, notes and publisher credits are preserved. Each edition is checked for all 114 surahs and 6,236 ayahs.')}</p><p>{t('IndoPak Nastaleeq text uses the matching Quran Foundation font, version 4.2.1. Credit: Ayman Siddiqui and R. Siddiqua, QuranWBW.com / Quran.com. Provided for Sadaqa-e-Jaria, not for sale or alteration; credits are retained. This flowing reader adapts lines to your screen and is not a reproduction of printed Mushaf page boundaries.')}</p><p>{t('Tanzil translations are supplied for non-commercial use only. Commercial reuse requires permission from the relevant translator or publisher.')} <a href="https://tanzil.net/trans/">Tanzil</a></p><a href="https://quranenc.com/en/home/api/">{t('QuranEnc source and API')}</a></section>
      <section className="source-status"><h2>{t('Reuse terms')}</h2><p>{t('The IslamHouse API Hub content policy permits use in apps when text is preserved and the source is clearly credited. Code is MIT; the source content follows IslamHouse’s content policy and is not covered by the code licence.')}</p><p>{t("Urdu matching narrations follow HadeethEnc.com\u2019s terms: unchanged text, clear publisher credit, and the published translation edition. The importer checks the current edition at build time.")}</p><p>{t('QuranEnc translations are republished unmodified with publisher attribution, edition version, and supplied footnotes. The build importer checks the currently published edition metadata.')}</p></section>
      <section className="source-caution"><h2>{t('Important caution')}</h2><p>{t(CAUTION_TEXT)}</p></section>
    </main>
  )
}
