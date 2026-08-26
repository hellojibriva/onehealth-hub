-- ============================================================
-- RCCE demo alerts — one localised pathway per geopolitical zone
--
-- Zone            Primary localised pathway
-- --------------  -------------------------
-- North East      Hausa
-- North West      Hausa
-- North Central   Hausa
-- South West      Yoruba
-- South East      Igbo
-- South South     Nigerian Pidgin
--
-- English stays available for every zone as the general/default
-- language; it is simply not the demonstrated pathway for any zone.
--
-- Two alerts already exist (North West / Hausa, South South / Pidgin).
-- This script re-languages the North Central advisory and adds the
-- three missing zones, so the demo shows all six pathways.
--
-- Idempotent: each insert is keyed on its title. Run in the Supabase
-- SQL editor.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- North Central → Hausa (was English)
--
-- The three northern zones share Hausa as the working lingua franca,
-- so an English advisory made the localisation logic invisible here.
-- ------------------------------------------------------------

update rcce_alerts
set    language_code = 'ha',
       language_name = 'Hausa',
       body_text = 'Sanarwa: Hadarin cutar Brucellosis ya karu a tsakanin dabbobi a yankinku. Manoma masu kiwon shanu, awaki da tumaki su dauki matakan kariya nan take.',
       prevention_tips = array[
         'Sanya safar hannu idan kana taba dabbobi ko taimakon haihuwa',
         'Kada ka sha madarar da ba a tafasa ba',
         'Ware duk dabbar da ta zubar da ciki ko ta yi rauni',
         'Yi wa dabbobi allurar riga-kafi — tuntubi jami''in dabbobi na karamar hukuma'
       ],
       action_items = array[
         'Ba da rahoton duk mutuwar dabba ko zubar ciki ga OneHealth Hub',
         'Tuntubi asibitin dabbobi mafi kusa domin gwajin garke',
         'Je asibiti idan ka ji zazzabi mai dorewa'
       ],
       where_to_go = 'Ofishin Dabbobi na Karamar Hukuma ko taswirar cibiyoyi ta OneHealth Hub',
       ussd_screen_1 = 'SANARWA: Brucellosis a yankinku. Sanya safar hannu. Kar ka sha madara mara tafasa. Danna 1.',
       ussd_screen_2 = 'Kariya: 1.Safar hannu 2.Madara mai tafasa 3.Ware dabbar da ta yi rauni 4.Riga-kafi. Danna 2 don likitan dabbobi.',
       ussd_screen_3 = 'Ba da rahoto a OneHealth Hub. Tuntubi Ofishin Dabbobi. Zazzabi? Je asibiti. Danna 0 don karshe.',
       updated_at = now()
where  geopolitical_zone = 'North Central'
  and  disease = 'Brucellosis';

-- ------------------------------------------------------------
-- North East → Hausa
-- ------------------------------------------------------------

insert into rcce_alerts (
  title, disease, alert_type, geopolitical_zone, language_code, language_name,
  body_text, prevention_tips, action_items, where_to_go,
  ussd_screen_1, ussd_screen_2, ussd_screen_3,
  trigger_month, status, sent_at
)
select
  'Meningitis Dry Season Alert — North East',
  'Meningitis (CSM)',
  'SEASONAL',
  'North East',
  'ha',
  'Hausa',
  'Gargadi: Lokacin rani da kura ya zo. Cutar sankarau (CSM) na yaduwa a yankinku. Ka kiyaye lafiyar yara da matasa.',
  array[
    'Ka bude tagogi domin iska ta shiga daki',
    'Ka guji cunkoso a dakuna masu kunci',
    'Ka rufe baki idan kana tari ko atishawa',
    'Ka kai yara don allurar riga-kafi idan an sanar'
  ],
  array[
    'Zazzabi mai tsanani da tauri wuya? Je asibiti nan take',
    'Ka sanar da cibiyar lafiya idan mutane da yawa sun kamu',
    'Ka sanar da makwabta game da wannan gargadi'
  ],
  'Cibiyar Lafiya mafi kusa ko kira NCDC: 0800-9700-0010',
  'GARGADI: Sankarau na yaduwa lokacin rani. Bude taga. Guji cunkoso. Danna 1 don karin bayani.',
  'Kariya: 1.Iska mai shiga daki 2.Guji cunkoso 3.Rufe baki idan tari 4.Riga-kafi. Danna 2 don cibiyar lafiya.',
  'Zazzabi da tauri wuya? Je asibiti nan take. Kira NCDC: 0800-9700-0010. Danna 0 don karshe.',
  3,
  'SENT',
  now()
where not exists (
  select 1 from rcce_alerts where title = 'Meningitis Dry Season Alert — North East'
);

-- ------------------------------------------------------------
-- South West → Yoruba
-- ------------------------------------------------------------

insert into rcce_alerts (
  title, disease, alert_type, geopolitical_zone, language_code, language_name,
  body_text, prevention_tips, action_items, where_to_go,
  ussd_screen_1, ussd_screen_2, ussd_screen_3,
  trigger_month, status, sent_at
)
select
  'Lassa Fever Dry Season Warning — South West',
  'Lassa Fever',
  'SEASONAL',
  'South West',
  'yo',
  'Yoruba',
  'Ikilo: Akoko ogbele ti de. Iba Lassa n tan kaakiri ni agbegbe yin. E daabo bo ile yin ati ounje yin lowo eku.',
  array[
    'Bo ounje ati omi mole ki eku ma baa kan won',
    'E to ile ati agbala nu lojoojumo',
    'Ma se je eku tabi mu omitooro re',
    'Fo owo re daadaa saaju ki o to jeun'
  ],
  array[
    'Bi iba ba mu o tabi ara re ba n ro, lo si ile iwosan lesekese',
    'Jabo eku ti o ku nitosi ile re',
    'So fun awon aladugbo re nipa ikilo yii'
  ],
  'Ile Iwosan to sunmo tabi pe NCDC: 0800-9700-0010',
  'IKILO: Iba Lassa n tan kaakiri. Bo ounje re mole. Daabo bo ebi re. Te 1 fun alaye si i.',
  'Bi o se le daabo bo ara re: 1.Bo ounje 2.To ile nu 3.Yago fun eku 4.Fo owo. Te 2 fun ile iwosan.',
  'Bi ara re ko ba ya, lo si ile iwosan lesekese. Pe NCDC: 0800-9700-0010. Te 0 lati pari.',
  11,
  'SENT',
  now()
where not exists (
  select 1 from rcce_alerts where title = 'Lassa Fever Dry Season Warning — South West'
);

-- ------------------------------------------------------------
-- South East → Igbo
-- ------------------------------------------------------------

insert into rcce_alerts (
  title, disease, alert_type, geopolitical_zone, language_code, language_name,
  body_text, prevention_tips, action_items, where_to_go,
  ussd_screen_1, ussd_screen_2, ussd_screen_3,
  trigger_month, status, sent_at
)
select
  'Avian Influenza Advisory — Poultry Farmers South East',
  'Avian Influenza (H5N1)',
  'ADVISORY',
  'South East',
  'ig',
  'Igbo',
  'Ndumodu: Oria okuko (Avian Influenza) di na mpaghara gi. Ndi na-azu okuko kwesiri iwepu nchekwa ugbu a.',
  array[
    'Kewapu okuko ohuru site na ndi no n''ulu okuko gi izu abuo',
    'Sacha ulo okuko na ngwa oru gi mgbe niile',
    'Egbula okuko nwuru anwu na-eri ya',
    'Yiri uwe aka na nkwacha mgbe i na-eji okuko na-aru oru'
  ],
  array[
    'Koo onwu okuko na mberede na OneHealth Hub ozugbo',
    'Kpotuo onye ozo anumanu nke LGA gi',
    'Gaa ulo ogwu ma ahu na-ekpo gi oku ma i chotara okuko na-arịa oria'
  ],
  'Ulo oru dokinta anumanu nke LGA ma o bu njem ulo ogwu OneHealth Hub',
  'NDUMODU: Oria okuko di na mpaghara gi. Kewapu okuko ohuru. Sacha ulo okuko. Pia 1.',
  'Nchedo: 1.Kewapu okuko ohuru 2.Sacha ulo okuko 3.Erila okuko nwuru anwu 4.Yiri uwe aka. Pia 2.',
  'Koo onwu okuko na OneHealth Hub. Kpotuo dokinta anumanu LGA. Ahu oku? Gaa ulo ogwu. Pia 0.',
  null,
  'SENT',
  now()
where not exists (
  select 1 from rcce_alerts where title = 'Avian Influenza Advisory — Poultry Farmers South East'
);

commit;

-- Check: every zone should appear once, with its primary language.
--   select geopolitical_zone, language_name, disease, trigger_month
--   from rcce_alerts where status = 'SENT' order by geopolitical_zone;
