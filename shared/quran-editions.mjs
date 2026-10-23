export const quranEditions = [
  { key: 'english_saheeh', language: 'en', title: 'Noor International', publisher: 'QuranEnc.com' },
  { key: 'english_rwwad', language: 'en', title: 'Rowwad Translation Center', publisher: 'QuranEnc.com' },
  { key: 'english_hilali_khan', language: 'en', title: 'Hilali & Khan', publisher: 'QuranEnc.com' },
  { key: 'urdu_junagarhi', language: 'ur', title: 'محمد جوناگڑھی', publisher: 'QuranEnc.com' },
  { key: 'urdu_jalandhry', language: 'ur', title: 'فتح محمد جالندھری', publisher: 'Tanzil.net' },
  { key: 'bengali_muhiuddin', language: 'bn', title: 'মুহিউদ্দীন খান', publisher: 'Tanzil.net' },
]
export const defaultEdition = language => quranEditions.find(x => x.language === language)?.key || 'english_saheeh'
