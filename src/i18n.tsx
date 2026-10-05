import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getSetting, setSetting } from './data/db'
import { APP_EVENTS } from './core/appEvents'

export type AppLanguage = 'en' | 'ur'

const urdu: Record<string, string> = {
  'Home': 'صفحۂ اول', 'Library': 'کتب خانہ', 'Search': 'تلاش', 'Saved': 'محفوظ', 'Settings': 'ترتیبات',
  'Skip to content': 'اصل مواد پر جائیں', 'Send feedback': 'رائے بھیجیں', 'Feedback': 'رائے',
  'About': 'تعارف', 'Sources & credits': 'ماخذ اور حوالہ', 'Privacy': 'رازداری', 'Terms': 'شرائط',
  'THE GARDENS OF THE RIGHTEOUS': 'ریاض الصالحین', 'A place to return to the words.': 'نبی کریم ﷺ کے ارشادات سے وابستگی کا ایک پُرسکون مقام',
  'Read Riyad as-Salihin with the Arabic text and English translation, one chapter and one hadith at a time.': 'ریاض الصالحین عربی متن اور دستیاب ترجمے کے ساتھ، باب اور حدیث کے ترتیب وار مطالعے کے لیے۔',
  'Continue reading': 'مطالعہ جاری رکھیں', 'Start reading': 'مطالعہ شروع کریں', 'Search the collection': 'مجموعے میں تلاش کریں',
  'YOUR READING': 'آپ کا مطالعہ', 'Make room for reflection.': 'غور و فکر کے لیے وقت نکالیں', 'All chapters': 'تمام ابواب',
  'Begin with Chapter 1': 'پہلے باب سے آغاز کریں', 'Your saved passages': 'آپ کی محفوظ احادیث', 'Keep meaningful readings close, privately on this device.': 'پسندیدہ مطالعہ اسی آلے میں محفوظ رکھیں۔',
  'No account. No ads. No tracking.': 'نہ اکاؤنٹ، نہ اشتہار، نہ نگرانی۔', 'Hadith of the day': 'آج کی حدیث', 'Ayah of the day': 'آج کی آیت',
  'Read hadith': 'حدیث پڑھیں', 'Read ayah': 'آیت پڑھیں', 'Translation unavailable': 'ترجمہ دستیاب نہیں',
  'The Urdu translation for this collection is not available yet. The Arabic source text is shown.': 'اس مجموعے کا اردو ترجمہ فی الحال دستیاب نہیں۔ اصل عربی متن دکھایا جا رہا ہے۔',
  'On-device preferences': 'آپ کے آلے کی ترتیبات', 'Reading display': 'مطالعے کی ظاہری ترتیب', 'Arabic and translation size, theme, and diacritics.': 'عربی اور ترجمے کا حجم، رنگ اور اعراب۔',
  'Open': 'کھولیں', 'App language': 'ایپ کی زبان', 'Choose the language for menus and reading tools.': 'مینو اور مطالعے کے اختیارات کی زبان منتخب کریں۔',
  'English': 'English', 'Urdu': 'اردو', 'Translation language': 'ترجمے کی زبان', 'Choose Arabic or English for the reader.': 'مطالعے کے لیے عربی یا انگریزی منتخب کریں۔',
  'Sources and credits': 'ماخذ اور حوالہ', 'Review every Arabic dataset and translation independently.': 'عربی متن اور ہر ترجمے کے ماخذ الگ دیکھیں۔', 'View': 'دیکھیں',
  'Report a mistake, bug, or suggestion.': 'غلطی، مسئلے یا تجویز کی اطلاع دیں۔', 'Source status': 'ماخذ کی تفصیل',
  'Search Riyad': 'ریاض الصالحین میں تلاش', 'Find a passage': 'حدیث تلاش کریں', 'Search the Arabic text, English translation, hadith numbers, and chapter titles.': 'عربی متن، انگریزی ترجمے، حدیث نمبر یا باب کے عنوان سے تلاش کریں۔',
  'A word, number, or chapter…': 'لفظ، نمبر یا باب…', 'Preparing the search index…': 'تلاش کی تیاری ہو رہی ہے…', 'Search data could not be loaded. Please try again online.': 'تلاش کا مواد نہیں کھل سکا۔ انٹرنیٹ سے دوبارہ کوشش کریں۔',
  'Collection': 'مجموعہ', 'Chapters': 'ابواب', 'Find a chapter by title or number': 'عنوان یا نمبر سے باب تلاش کریں', 'Find a chapter': 'باب تلاش کریں',
  'No chapters match': 'کوئی باب نہیں ملا', 'Continue where you left off': 'پچھلا مطالعہ جاری رکھیں', 'hadith': 'احادیث',
  'One collection · read by chapter': 'ایک مجموعہ · باب وار مطالعہ', 'The library': 'کتب خانہ', 'Riyad as-Salihin, with its Arabic text and a published English translation.': 'ریاض الصالحین کا عربی متن اور مطبوعہ انگریزی ترجمہ۔',
  'The collection': 'مجموعہ', 'narrations': 'روایات', 'Arabic and English': 'عربی اور انگریزی', 'Local reading text is ready, including offline.': 'مطالعے کا متن آلے میں موجود ہے، آف لائن بھی دستیاب۔',
  'Begin reading': 'مطالعہ شروع کریں', 'Browse all chapters': 'تمام ابواب دیکھیں', 'This preview contains no real hadith text yet.': 'اس پیش منظر میں اصل احادیث شامل نہیں۔',
  'Switch to the local real-data build to read.': 'مطالعے کے لیے اصل مواد والا ورژن چلائیں۔', 'Opening the locally stored chapter index…': 'محفوظ ابواب کھل رہے ہیں…', 'The local collection data could not be loaded.': 'مجموعے کا مواد نہیں کھل سکا۔',
  'Text and translation are provided by IslamHouse / IslamEnc and shown as published. Translation coverage is identified per narration.': 'متن اور ترجمہ IslamHouse / IslamEnc کے فراہم کردہ ہیں اور اصل صورت میں دکھائے گئے ہیں۔ ہر روایت کے ترجمے کی دستیابی الگ درج ہے۔',
  'Riyad as-Salihin': 'ریاض الصالحین', 'Display': 'مطالعہ', 'Reading settings': 'مطالعے کی ترتیبات', 'Arabic size': 'عربی متن کا حجم', 'Translation size': 'ترجمے کا حجم',
  'Theme': 'رنگ', 'System': 'سسٹم', 'Light': 'روشن', 'Dark': 'تاریک', 'Sepia': 'کتابی', 'Diacritics': 'اعراب', 'Show Arabic tashkeel where provided.': 'عربی کے دستیاب اعراب دکھائیں۔', 'Translation preview': 'ترجمے کا نمونہ', 'Reset': 'اصل ترتیبات',
  'Riyad as-Salihin / Chapter': 'ریاض الصالحین / باب', 'Chapter unavailable': 'باب دستیاب نہیں', 'Arabic with English translation': 'عربی متن اور انگریزی ترجمہ', 'Browse chapters': 'ابواب دیکھیں', 'Trust filter': 'درجے کے مطابق', 'All': 'سب', 'Sahih': 'صحیح', 'Sahih and Hasan': 'صحیح اور حسن', 'Offline text': 'آف لائن مطالعہ', 'Downloading…': 'ڈاؤن لوڈ ہو رہا ہے…', 'Available offline': 'آف لائن دستیاب', 'Download failed': 'ڈاؤن لوڈ ناکام',
  'About this translation': 'اس ترجمے کے بارے میں', 'Language:': 'زبان:', 'Translation source:': 'ترجمے کا ماخذ:', 'Not reviewed by this app’s team.': 'اس ایپ کی ٹیم نے اس کا جائزہ نہیں لیا۔', 'Text source:': 'متن کا ماخذ:',
  'A quiet, private reader': 'پُرسکون اور نجی مطالعہ', 'This free app has no ads, analytics, accounts, cookies, or personal names. Reading preferences and saved items stay on your device.': 'یہ مفت ایپ اشتہارات، تجزیاتی نگرانی، اکاؤنٹس اور کوکیز سے پاک ہے۔ مطالعے کی ترتیبات اور محفوظ مواد آپ کے آلے ہی میں رہتا ہے۔',
  'Important caution': 'ضروری وضاحت', 'Your reading stays on your device': 'آپ کا مطالعہ آپ کے آلے میں محفوظ ہے', 'What this app stores': 'ایپ میں کیا محفوظ ہوتا ہے', 'Reading settings, saved hadith and progress are stored in your browser. There are no accounts, analytics or cookies.': 'مطالعے کی ترتیبات، محفوظ احادیث اور پیش رفت آپ کے براؤزر میں محفوظ ہوتی ہیں۔ کوئی اکاؤنٹ، تجزیاتی نگرانی یا کوکیز نہیں۔',
  'Feedback is sent only when you submit the form. The request goes to the configured third-party form service': 'رائے صرف فارم بھیجنے پر روانہ ہوتی ہے۔ درخواست منتخب کردہ بیرونی فارم سروس کو جاتی ہے', 'The destination email is never included in this app.': 'وصول کنندہ کا ای میل اس ایپ میں شامل نہیں۔', 'External requests': 'بیرونی رابطے', 'The published app makes no third-party runtime requests except a feedback submission you choose to send.': 'آپ کی بھیجی ہوئی رائے کے سوا ایپ استعمال کے دوران کسی بیرونی سروس سے رابطہ نہیں کرتی۔',
  'Terms and disclaimer': 'شرائط اور وضاحت', 'Licensing': 'استعمال کے حقوق', 'No warranty': 'ذمہ داری کی حدود', 'Transparency': 'شفافیت',
  'Every reading must keep its text, translation, and license attached to the source that supplied it.': 'ہر متن اور ترجمہ اپنے اصل ماخذ اور استعمال کی شرائط کے ساتھ دکھایا جانا چاہیے۔', 'Riyad as-Salihin · Arabic': 'ریاض الصالحین · عربی', 'English translation': 'انگریزی ترجمہ', 'Reuse terms': 'استعمال کی شرائط',
  'Help improve the app': 'ایپ بہتر بنانے میں مدد کریں', 'Type': 'قسم', 'Mistake in hadith or translation': 'حدیث یا ترجمے میں غلطی', 'Bug': 'تکنیکی مسئلہ', 'Suggestion': 'تجویز', 'Other': 'دیگر', 'Message': 'پیغام', 'Required': 'ضروری', 'Reply email': 'جوابی ای میل', 'Optional': 'اختیاری', 'Please enter a message.': 'براہ کرم پیغام لکھیں۔', 'Please keep the message to 2,000 characters.': 'پیغام 2,000 حروف تک محدود رکھیں۔', 'Thank you': 'شکریہ', 'Your feedback was sent.': 'آپ کی رائے بھیج دی گئی۔', 'Sending…': 'بھیجا جا رہا ہے…', 'Close': 'بند کریں',
  'Install for offline reading': 'آف لائن مطالعے کے لیے انسٹال کریں', 'A new version is ready.': 'نیا ورژن دستیاب ہے۔', 'Update': 'اپ ڈیٹ', 'Later': 'بعد میں',
  'Chapter': 'باب', 'Hadith': 'حدیث', 'Translation notes': 'ترجمے کے حواشی', 'Text & sources': 'متن اور ماخذ', 'Pick up where you left off': 'پچھلا مطالعہ جاری رکھیں', 'The collection opens with intention.': 'مجموعے کا آغاز نیت کے باب سے ہوتا ہے۔',
  'Reader controls': 'مطالعے کے اختیارات', 'Open reading display settings': 'مطالعے کی ظاہری ترتیبات کھولیں', 'Grade filter': 'درجے کے مطابق', 'Sahih only': 'صرف صحیح', 'Preparing this chapter…': 'باب کھل رہا ہے…', 'No records match this trust filter. Missing grades are never inferred.': 'اس درجے کے مطابق کوئی حدیث نہیں ملی۔ ناموجود درجات اخذ نہیں کیے جاتے۔',
  'translation': 'ترجمہ', 'Sources': 'ماخذ', 'Report an error': 'غلطی کی اطلاع دیں', 'English translation is not available for this narration; the Arabic text above is from the source edition.': 'اس روایت کا انگریزی ترجمہ دستیاب نہیں؛ اصل عربی متن اوپر درج ہے۔',
  'Search Arabic text, hadith numbers, and chapter titles.': 'عربی متن، حدیث نمبر یا باب کے عنوان سے تلاش کریں۔', 'Search hadith': 'حدیث تلاش کریں', 'Enter at least two characters to search': 'تلاش کے لیے کم از کم دو حروف لکھیں', 'First 40 matches': 'پہلے 40 نتائج', 'match': 'نتیجہ', 'matches': 'نتائج', 'for': 'کے لیے',
  'Check the data import and try again.': 'مواد کی درآمد دیکھ کر دوبارہ کوشش کریں۔', 'Loading the chapter list.': 'ابواب کی فہرست کھل رہی ہے۔',
  'The Gardens of the Righteous, presented in its original chapters.': 'ریاض الصالحین، اصل ابواب کی ترتیب کے مطابق۔',
  'This app is prepared by people, and people can make mistakes in selecting, displaying or translating content. Hadith texts, translations and grades are shown as received from their credited source. This app is for reading and learning and is not a source of religious rulings (fatwa); please consult a qualified scholar. If you find a mistake or have a suggestion, please tell us using the Feedback button.': 'یہ ایپ انسانوں نے تیار کی ہے، اور انتخاب، پیشکش یا ترجمے میں غلطی ممکن ہے۔ احادیث، تراجم اور درجات متعلقہ ماخذ کے مطابق دکھائے جاتے ہیں۔ یہ ایپ مطالعے اور سیکھنے کے لیے ہے، شرعی فتویٰ نہیں؛ رہنمائی کے لیے اہلِ علم سے رجوع کریں۔ غلطی یا تجویز کی اطلاع رائے کے بٹن سے دیں۔',
  'Arabic text and original chapter order are sourced from IslamHouse.com / IslamEnc.com. The app preserves the source wording and reference numbering; only the page layout is reflowed for reading.': 'عربی متن اور اصل باب بندی IslamHouse.com / IslamEnc.com سے ہیں۔ اصل عبارت اور حوالہ نمبر برقرار رکھے گئے ہیں؛ صرف مطالعے کے لیے سطری ترتیب بدلتی ہے۔',
  "The published English text is from IslamHouse.com / IslamEnc.com and is paired by the source's hadith reference. Some narrations may not have an English entry; those remain Arabic-only and are never filled with generated text.": 'مطبوعہ انگریزی متن IslamHouse.com / IslamEnc.com کا ہے اور ماخذ کے حدیث نمبر سے ملایا گیا ہے۔ بعض روایات کا انگریزی ترجمہ موجود نہیں؛ ان میں صرف عربی دکھائی جاتی ہے، کوئی مصنوعی ترجمہ شامل نہیں کیا جاتا۔',
  "The IslamHouse API Hub content policy permits use in apps and offline when text is preserved and the source is clearly credited. Code is MIT; the source content follows IslamHouse's content policy and is not covered by the code licence.": 'IslamHouse API Hub کی مواد پالیسی کے مطابق اصل متن اور واضح حوالہ برقرار رکھتے ہوئے ایپ اور آف لائن مطالعے میں مواد استعمال کیا جا سکتا ہے۔ کوڈ MIT لائسنس کے تحت ہے؛ ماخذ کا مواد اس لائسنس میں شامل نہیں۔',
  'Daily Quranic Arabic and English/Urdu meanings are provided by QuranEnc.com. The app preserves the API text and footnotes; source edition, translator, version and retrieval date are bundled with each build. The sample rotates locally by date and works offline.': 'آج کی قرآنی آیت اور اس کے انگریزی یا اردو مفاہیم QuranEnc.com سے ہیں۔ اصل متن اور حواشی برقرار رہتے ہیں؛ نسخے کا حوالہ، ورژن اور حصول کی تاریخ ہر تعمیر کے ساتھ شامل ہوتے ہیں۔ آیت روزانہ اسی آلے پر بدلتی ہے اور آف لائن بھی دستیاب ہے۔',
  'QuranEnc translations are republished unmodified with publisher attribution, edition version, and supplied footnotes. The build importer checks the currently published edition metadata.': 'QuranEnc کے تراجم ناشر کے حوالہ، ورژن اور فراہم کردہ حواشی سمیت بغیر ترمیم شائع ہوتے ہیں۔ تعمیر کے وقت درآمدی عمل دستیاب نسخے کی معلومات تازہ کرتا ہے۔',
  'The application code is provided under the MIT License. Hadith content, translations, grades, and other source material are not covered by that licence and remain subject to their publishers’ terms.': 'ایپ کا کوڈ MIT لائسنس کے تحت ہے۔ احادیث، تراجم، درجات اور دیگر ماخذی مواد اس لائسنس میں شامل نہیں اور اپنے ناشر کی شرائط کے تابع ہیں۔',
  'The app is provided without warranty. Verify important information with its credited source and consult a qualified scholar for religious guidance.': 'ایپ کسی ضمانت کے بغیر فراہم کی جاتی ہے۔ اہم معلومات اصل ماخذ سے جانچیں اور دینی رہنمائی کے لیے مستند عالم سے رجوع کریں۔',
  'Stored only on this device': 'صرف اسی آلے میں محفوظ', 'Bookmarks, folders, and reading progress never leave your browser.': 'محفوظ احادیث، فولڈرز اور مطالعے کی پیش رفت آپ کے براؤزر سے باہر نہیں جاتے۔', 'New folder name': 'نئے فولڈر کا نام', 'Add folder': 'فولڈر بنائیں', 'Bookmark folders': 'محفوظ مطالعے کے فولڈرز', 'No saved hadith here yet. Use the bookmark action while reading to add one.': 'ابھی کوئی حدیث محفوظ نہیں۔ مطالعے کے دوران بک مارک سے حدیث محفوظ کریں۔', 'Open reading': 'مطالعہ کھولیں',
  'Please wait a moment before sending again.': 'دوبارہ بھیجنے سے پہلے چند لمحے انتظار کریں۔', 'The feedback service did not accept the message.': 'رائے کی سروس پیغام قبول نہیں کر سکی۔', 'Unable to send feedback. Please try again.': 'رائے نہیں بھیجی جا سکی۔ دوبارہ کوشش کریں۔', 'Feedback is unavailable in development until the feedback service is configured.': 'ڈیولپمنٹ میں رائے بھیجنے کی سہولت تب دستیاب ہوگی جب سروس ترتیب دی جائے۔', 'Sending contacts the third-party form service at': 'بھیجنے پر بیرونی فارم سروس سے رابطہ ہوگا:', 'only when you submit.': 'صرف آپ کی اجازت سے بھیجنے پر۔',
  'Riyad as-Salihin home': 'ریاض الصالحین — صفحۂ اول', 'Preview build: content is being added': 'پیش منظر: مجموعے کا مواد شامل کیا جا رہا ہے', 'Opening the collection': 'مجموعہ کھل رہا ہے', 'Primary navigation': 'بنیادی نیویگیشن', 'Footer': 'صفحے کے آخر کے روابط',
  'Explore Riyad as-Salihin': 'ریاض الصالحین کا مطالعہ', 'Arabic and Urdu': 'عربی اور اردو', 'English and Urdu': 'انگریزی اور اردو', 'Qur’an': 'قرآن', 'Read this topic': 'یہ موضوع پڑھیں', 'Live reading preview': 'مطالعے کا براہِ راست نمونہ', 'Close reading settings': 'مطالعے کی ترتیبات بند کریں', 'Close feedback': 'رائے کا فارم بند کریں',
  'Remove folder; keep saved items': 'فولڈر ہٹائیں؛ محفوظ احادیث برقرار رہیں گی', 'Folder name is required.': 'فولڈر کا نام درج کریں۔', 'A folder with that name already exists.': 'اس نام کا فولڈر پہلے سے موجود ہے۔', 'Folder added.': 'فولڈر شامل ہو گیا۔', 'Remove folder': 'فولڈر ہٹائیں', 'Remove saved reading': 'محفوظ مطالعہ ہٹائیں', 'Copy': 'کاپی کریں', 'Copied': 'کاپی ہو گیا', 'Share': 'شیئر کریں', 'Save hadith': 'حدیث محفوظ کریں', 'Remove hadith from saved': 'محفوظ احادیث سے ہٹائیں', 'Reference:': 'حوالہ:', 'No folder': 'کوئی فولڈر نہیں',
  'Could not save the folder on this device. Please try again.': 'فولڈر اس آلے پر محفوظ نہیں ہو سکا۔ دوبارہ کوشش کریں۔', 'Folder removed. Its bookmarks are still saved under All.': 'فولڈر ہٹا دیا گیا؛ اس کی احادیث سب کے حصے میں محفوظ ہیں۔', 'Could not remove that folder. Please try again.': 'فولڈر نہیں ہٹ سکا۔ دوبارہ کوشش کریں۔', 'Reading theme': 'مطالعے کا رنگ', 'Light theme': 'روشن رنگ', 'Dark theme': 'تاریک رنگ', 'Sepia theme': 'کتابی رنگ',
  'Opening the collection…': 'مجموعہ کھل رہا ہے…',
  'Arabic text only': 'صرف عربی متن',
  'The published English text is from IslamHouse.com / IslamEnc.com and is paired by the source’s hadith reference. Some narrations may not have an English entry; those remain Arabic-only and are never filled with generated text.': 'مطبوعہ انگریزی متن IslamHouse.com / IslamEnc.com سے ہے اور ماخذ کے حدیث نمبر سے ملایا گیا ہے۔ بعض روایات کا انگریزی ترجمہ موجود نہیں؛ ان میں صرف عربی دکھائی جاتی ہے، کوئی مصنوعی ترجمہ شامل نہیں کیا جاتا۔',
  'The IslamHouse API Hub content policy permits use in apps and offline when text is preserved and the source is clearly credited. Code is MIT; the source content follows IslamHouse’s content policy and is not covered by the code licence.': 'IslamHouse API Hub کی مواد پالیسی کے مطابق اصل متن اور واضح حوالہ برقرار رکھتے ہوئے ایپ اور آف لائن مطالعے میں مواد استعمال کیا جا سکتا ہے۔ کوڈ MIT لائسنس کے تحت ہے؛ ماخذ کا مواد اس لائسنس میں شامل نہیں۔',
}

type LocaleContextValue = { language: AppLanguage; setLanguage: (language: AppLanguage) => void; t: (text: string) => string }
const LocaleContext = createContext<LocaleContextValue | null>(null)

export function AppLocaleProvider({ children }: { children: ReactNode }) {
  const [language, setCurrentLanguage] = useState<AppLanguage>('en')
  useEffect(() => {
    void getSetting<AppLanguage>('appLanguage', 'en').then(setCurrentLanguage)
    const update = (event: Event) => setCurrentLanguage((event as CustomEvent<AppLanguage>).detail)
    window.addEventListener(APP_EVENTS.appLanguageChange, update)
    return () => window.removeEventListener(APP_EVENTS.appLanguageChange, update)
  }, [])
  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr'
  }, [language])
  const value = useMemo<LocaleContextValue>(() => ({
    language,
    setLanguage: (next) => { setCurrentLanguage(next); void setSetting('appLanguage', next); window.dispatchEvent(new CustomEvent(APP_EVENTS.appLanguageChange, { detail: next })) },
    t: (text) => language === 'ur' ? (urdu[text] ?? text) : text,
  }), [language])
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useI18n() {
  const value = useContext(LocaleContext)
  if (!value) throw new Error('useI18n must be used within AppLocaleProvider')
  return value
}
