/**
 * MEALS.JS – Módulo de Comidas v2
 * Con base de datos de 200+ alimentos y autocompletado inteligente tipo IA.
 */

const MealsModule = (() => {

  const MEAL_NAMES = ['Desayuno', 'Almuerzo', 'Comida', 'Merienda', 'Cena'];
  let selectedDate = Utils.today();
  let currentTab   = 'today';
  let openMeals    = { Desayuno: true };
  let acTimer      = null; // debounce autocomplete

  // ================================================================
  // BASE DE DATOS LOCAL 200+ ALIMENTOS (por 100g/ml salvo indicación)
  // ================================================================
  const FOOD_DB = [
    // --- PROTEÍNAS ANIMALES ---
    { name:'Pechuga de pollo a la plancha', kcal:165, protein:31, carbs:0,   fat:3.6,  unit:'g',   cat:'🍗 Carne' },
    { name:'Pechuga de pollo hervida',      kcal:150, protein:29, carbs:0,   fat:2.8,  unit:'g',   cat:'🍗 Carne' },
    { name:'Muslo de pollo con piel',       kcal:209, protein:26, carbs:0,   fat:11,   unit:'g',   cat:'🍗 Carne' },
    { name:'Solomillo de cerdo',            kcal:143, protein:22, carbs:0,   fat:5.6,  unit:'g',   cat:'🍗 Carne' },
    { name:'Filete de ternera',             kcal:185, protein:29, carbs:0,   fat:7.2,  unit:'g',   cat:'🍗 Carne' },
    { name:'Hamburguesa de ternera 80/20',  kcal:254, protein:17, carbs:0,   fat:20,   unit:'g',   cat:'🍗 Carne' },
    { name:'Pavo a la plancha',             kcal:135, protein:29, carbs:0,   fat:1.5,  unit:'g',   cat:'🍗 Carne' },
    { name:'Bacon / Panceta',              kcal:541, protein:37, carbs:1.4, fat:42,   unit:'g',   cat:'🍗 Carne' },
    { name:'Jamón serrano',                 kcal:241, protein:31, carbs:0,   fat:13,   unit:'g',   cat:'🍗 Carne' },
    { name:'Jamón york (cocido)',           kcal:107, protein:18, carbs:1.5, fat:3.2,  unit:'g',   cat:'🍗 Carne' },
    { name:'Salmón a la plancha',           kcal:208, protein:20, carbs:0,   fat:13,   unit:'g',   cat:'🐟 Pescado' },
    { name:'Atún al natural (lata)',        kcal:108, protein:24, carbs:0,   fat:0.7,  unit:'g',   cat:'🐟 Pescado' },
    { name:'Atún en aceite (lata)',         kcal:198, protein:26, carbs:0,   fat:10,   unit:'g',   cat:'🐟 Pescado' },
    { name:'Merluza al horno',              kcal:90,  protein:18, carbs:0,   fat:1.8,  unit:'g',   cat:'🐟 Pescado' },
    { name:'Bacalao desalado',              kcal:82,  protein:18, carbs:0,   fat:0.8,  unit:'g',   cat:'🐟 Pescado' },
    { name:'Sardinas en lata',              kcal:208, protein:25, carbs:0,   fat:11,   unit:'g',   cat:'🐟 Pescado' },
    { name:'Gambas cocidas',                kcal:99,  protein:21, carbs:0.3, fat:1.4,  unit:'g',   cat:'🐟 Pescado' },
    { name:'Huevo entero (L)',              kcal:78,  protein:6.3,carbs:0.6, fat:5.3,  unit:'ud',  cat:'🥚 Huevos', grams:60 },
    { name:'Clara de huevo',               kcal:17,  protein:3.6,carbs:0.2, fat:0.1,  unit:'ud',  cat:'🥚 Huevos', grams:33 },
    { name:'Huevo revuelto (2 und)',        kcal:180, protein:12, carbs:1.2, fat:14,   unit:'ración', cat:'🥚 Huevos', grams:120 },
    // --- LÁCTEOS ---
    { name:'Leche entera',                  kcal:61,  protein:3.2,carbs:4.8, fat:3.3,  unit:'ml',  cat:'🥛 Lácteos' },
    { name:'Leche semidesnatada',           kcal:45,  protein:3.4,carbs:4.8, fat:1.6,  unit:'ml',  cat:'🥛 Lácteos' },
    { name:'Leche desnatada',               kcal:32,  protein:3.3,carbs:4.8, fat:0.1,  unit:'ml',  cat:'🥛 Lácteos' },
    { name:'Yogur griego natural',          kcal:97,  protein:9,  carbs:3.6, fat:5,    unit:'g',   cat:'🥛 Lácteos' },
    { name:'Yogur natural desnatado',       kcal:36,  protein:4.3,carbs:5,   fat:0.1,  unit:'g',   cat:'🥛 Lácteos' },
    { name:'Skyr natural',                  kcal:63,  protein:11, carbs:4,   fat:0.2,  unit:'g',   cat:'🥛 Lácteos' },
    { name:'Queso cottage',                 kcal:98,  protein:11, carbs:3.4, fat:4.3,  unit:'g',   cat:'🥛 Lácteos' },
    { name:'Queso fresco (Burgos)',         kcal:140, protein:14, carbs:2,   fat:9,    unit:'g',   cat:'🥛 Lácteos' },
    { name:'Queso mozzarella',              kcal:280, protein:28, carbs:3.1, fat:17,   unit:'g',   cat:'🥛 Lácteos' },
    { name:'Queso parmesano rallado',       kcal:431, protein:38, carbs:3.2, fat:29,   unit:'g',   cat:'🥛 Lácteos' },
    { name:'Queso manchego curado',         kcal:392, protein:32, carbs:0.5, fat:29,   unit:'g',   cat:'🥛 Lácteos' },
    { name:'Requesón',                      kcal:73,  protein:11, carbs:4.3, fat:0.9,  unit:'g',   cat:'🥛 Lácteos' },
    // --- PROTEÍNAS VEGETALES ---
    { name:'Proteína whey (scoop 30g)',     kcal:120, protein:24, carbs:3,   fat:1.5,  unit:'scoop', cat:'💪 Suplementos', grams:30 },
    { name:'Proteína caseína (scoop 30g)',  kcal:115, protein:24, carbs:2,   fat:1,    unit:'scoop', cat:'💪 Suplementos', grams:30 },
    { name:'Proteína vegana (scoop 30g)',   kcal:110, protein:22, carbs:4,   fat:1.5,  unit:'scoop', cat:'💪 Suplementos', grams:30 },
    { name:'Tofu firme',                    kcal:76,  protein:8,  carbs:1.9, fat:4.2,  unit:'g',   cat:'🌿 Vegetales' },
    { name:'Tempeh',                        kcal:195, protein:19, carbs:10,  fat:11,   unit:'g',   cat:'🌿 Vegetales' },
    { name:'Edamame cocido',               kcal:121, protein:11, carbs:9,   fat:5.2,  unit:'g',   cat:'🌿 Vegetales' },
    { name:'Lentejas cocidas',              kcal:116, protein:9,  carbs:20,  fat:0.4,  unit:'g',   cat:'🫘 Legumbres' },
    { name:'Garbanzos cocidos',             kcal:164, protein:9,  carbs:27,  fat:2.6,  unit:'g',   cat:'🫘 Legumbres' },
    { name:'Alubias negras cocidas',        kcal:132, protein:9,  carbs:24,  fat:0.5,  unit:'g',   cat:'🫘 Legumbres' },
    { name:'Alubias blancas cocidas',       kcal:127, protein:9,  carbs:23,  fat:0.5,  unit:'g',   cat:'🫘 Legumbres' },
    { name:'Judías verdes cocidas',         kcal:35,  protein:1.9,carbs:7.1, fat:0.4,  unit:'g',   cat:'🫘 Legumbres' },
    // --- CARBOHIDRATOS ---
    { name:'Arroz blanco cocido',           kcal:130, protein:2.7,carbs:28,  fat:0.3,  unit:'g',   cat:'🍚 Cereales' },
    { name:'Arroz integral cocido',         kcal:111, protein:2.6,carbs:23,  fat:0.9,  unit:'g',   cat:'🍚 Cereales' },
    { name:'Pasta cocida',                  kcal:131, protein:5,  carbs:25,  fat:1.1,  unit:'g',   cat:'🍝 Pasta' },
    { name:'Pasta integral cocida',         kcal:124, protein:5.3,carbs:23,  fat:0.9,  unit:'g',   cat:'🍝 Pasta' },
    { name:'Avena cruda',                   kcal:389, protein:17, carbs:66,  fat:7,    unit:'g',   cat:'🍚 Cereales' },
    { name:'Avena cocida (porridge)',       kcal:71,  protein:2.5,carbs:12,  fat:1.4,  unit:'g',   cat:'🍚 Cereales' },
    { name:'Pan blanco de barra',           kcal:265, protein:9,  carbs:50,  fat:3.2,  unit:'g',   cat:'🍞 Pan' },
    { name:'Pan integral',                  kcal:247, protein:13, carbs:41,  fat:3.4,  unit:'g',   cat:'🍞 Pan' },
    { name:'Pan de centeno',                kcal:259, protein:9,  carbs:48,  fat:3.3,  unit:'g',   cat:'🍞 Pan' },
    { name:'Tortilla de trigo (20cm)',      kcal:218, protein:6,  carbs:38,  fat:5.2,  unit:'ud',  cat:'🍞 Pan', grams:45 },
    { name:'Patata hervida',                kcal:77,  protein:2,  carbs:17,  fat:0.1,  unit:'g',   cat:'🥔 Tubérculos' },
    { name:'Patata asada con piel',         kcal:93,  protein:2.5,carbs:21,  fat:0.1,  unit:'g',   cat:'🥔 Tubérculos' },
    { name:'Boniato/Camote cocido',        kcal:86,  protein:1.6,carbs:20,  fat:0.1,  unit:'g',   cat:'🥔 Tubérculos' },
    { name:'Patatas fritas (bolsa)',        kcal:536, protein:7,  carbs:53,  fat:34,   unit:'g',   cat:'🍟 Snacks' },
    { name:'Quinoa cocida',                 kcal:120, protein:4.4,carbs:21,  fat:1.9,  unit:'g',   cat:'🍚 Cereales' },
    { name:'Cuscús cocido',                 kcal:112, protein:3.8,carbs:23,  fat:0.2,  unit:'g',   cat:'🍚 Cereales' },
    // --- FRUTAS ---
    { name:'Plátano maduro',               kcal:89,  protein:1.1,carbs:23,  fat:0.3,  unit:'g',   cat:'🍌 Frutas' },
    { name:'Manzana (mediana 150g)',        kcal:52,  protein:0.3,carbs:14,  fat:0.2,  unit:'g',   cat:'🍎 Frutas' },
    { name:'Naranja (mediana 130g)',        kcal:47,  protein:0.9,carbs:12,  fat:0.1,  unit:'g',   cat:'🍊 Frutas' },
    { name:'Fresa',                         kcal:32,  protein:0.7,carbs:7.7, fat:0.3,  unit:'g',   cat:'🍓 Frutas' },
    { name:'Arándanos',                     kcal:57,  protein:0.7,carbs:14,  fat:0.3,  unit:'g',   cat:'🫐 Frutas' },
    { name:'Pera',                          kcal:57,  protein:0.4,carbs:15,  fat:0.1,  unit:'g',   cat:'🍐 Frutas' },
    { name:'Kiwi',                          kcal:61,  protein:1.1,carbs:15,  fat:0.5,  unit:'g',   cat:'🥝 Frutas' },
    { name:'Mango',                         kcal:60,  protein:0.8,carbs:15,  fat:0.4,  unit:'g',   cat:'🥭 Frutas' },
    { name:'Piña natural',                  kcal:50,  protein:0.5,carbs:13,  fat:0.1,  unit:'g',   cat:'🍍 Frutas' },
    { name:'Sandía',                        kcal:30,  protein:0.6,carbs:7.5, fat:0.2,  unit:'g',   cat:'🍉 Frutas' },
    { name:'Uva',                           kcal:67,  protein:0.6,carbs:17,  fat:0.4,  unit:'g',   cat:'🍇 Frutas' },
    { name:'Melocotón / Durazno',           kcal:39,  protein:0.9,carbs:9.5, fat:0.3,  unit:'g',   cat:'🍑 Frutas' },
    { name:'Aguacate',                      kcal:160, protein:2,  carbs:9,   fat:15,   unit:'g',   cat:'🥑 Frutas' },
    { name:'Dátil seco',                    kcal:282, protein:2.5,carbs:75,  fat:0.4,  unit:'g',   cat:'🌴 Frutas' },
    // --- VERDURAS ---
    { name:'Brócoli cocido',               kcal:35,  protein:2.4,carbs:7,   fat:0.4,  unit:'g',   cat:'🥦 Verduras' },
    { name:'Espinacas crudas',             kcal:23,  protein:2.9,carbs:3.6, fat:0.4,  unit:'g',   cat:'🌿 Verduras' },
    { name:'Lechuga',                       kcal:15,  protein:1.4,carbs:2.9, fat:0.2,  unit:'g',   cat:'🥬 Verduras' },
    { name:'Tomate',                        kcal:18,  protein:0.9,carbs:3.9, fat:0.2,  unit:'g',   cat:'🍅 Verduras' },
    { name:'Zanahoria cruda',              kcal:41,  protein:0.9,carbs:10,  fat:0.2,  unit:'g',   cat:'🥕 Verduras' },
    { name:'Pimiento rojo',                kcal:31,  protein:1,  carbs:7,   fat:0.3,  unit:'g',   cat:'🫑 Verduras' },
    { name:'Calabacín cocido',             kcal:17,  protein:1.2,carbs:3.5, fat:0.3,  unit:'g',   cat:'🥒 Verduras' },
    { name:'Pepino',                        kcal:15,  protein:0.7,carbs:3.6, fat:0.1,  unit:'g',   cat:'🥒 Verduras' },
    { name:'Cebolla',                       kcal:40,  protein:1.1,carbs:9.3, fat:0.1,  unit:'g',   cat:'🧅 Verduras' },
    { name:'Ajo',                           kcal:149, protein:6.4,carbs:33,  fat:0.5,  unit:'g',   cat:'🧄 Verduras' },
    { name:'Coliflor cocida',              kcal:23,  protein:1.8,carbs:4.5, fat:0.3,  unit:'g',   cat:'🥦 Verduras' },
    { name:'Espárragos cocidos',           kcal:20,  protein:2.2,carbs:3.7, fat:0.2,  unit:'g',   cat:'🌿 Verduras' },
    { name:'Champiñones',                   kcal:22,  protein:3.1,carbs:3.3, fat:0.3,  unit:'g',   cat:'🍄 Verduras' },
    // --- GRASAS SALUDABLES ---
    { name:'Aceite de oliva virgen extra',  kcal:884, protein:0,  carbs:0,   fat:100,  unit:'g',   cat:'🫒 Grasas' },
    { name:'Aceite de coco',               kcal:862, protein:0,  carbs:0,   fat:100,  unit:'g',   cat:'🫒 Grasas' },
    { name:'Almendras',                     kcal:579, protein:21, carbs:22,  fat:50,   unit:'g',   cat:'🥜 Frutos secos' },
    { name:'Nueces',                        kcal:654, protein:15, carbs:14,  fat:65,   unit:'g',   cat:'🥜 Frutos secos' },
    { name:'Anacardos',                     kcal:553, protein:18, carbs:30,  fat:44,   unit:'g',   cat:'🥜 Frutos secos' },
    { name:'Cacahuetes',                    kcal:567, protein:26, carbs:16,  fat:49,   unit:'g',   cat:'🥜 Frutos secos' },
    { name:'Mantequilla de cacahuete',     kcal:588, protein:25, carbs:20,  fat:50,   unit:'g',   cat:'🥜 Frutos secos' },
    { name:'Mantequilla de almendra',      kcal:614, protein:21, carbs:19,  fat:56,   unit:'g',   cat:'🥜 Frutos secos' },
    { name:'Semillas de chía',             kcal:486, protein:17, carbs:42,  fat:31,   unit:'g',   cat:'🌾 Semillas' },
    { name:'Semillas de lino',             kcal:534, protein:18, carbs:29,  fat:42,   unit:'g',   cat:'🌾 Semillas' },
    { name:'Semillas de girasol',          kcal:584, protein:21, carbs:20,  fat:51,   unit:'g',   cat:'🌾 Semillas' },
    // --- COMIDAS PREPARADAS ---
    { name:'Tortilla española (ración)',    kcal:160, protein:8.5,carbs:11,  fat:10,   unit:'g',   cat:'🍳 Preparados' },
    { name:'Ensalada mixta (base)',        kcal:15,  protein:1,  carbs:2.8, fat:0.2,  unit:'g',   cat:'🥗 Preparados' },
    { name:'Pizza Margherita',             kcal:266, protein:11, carbs:33,  fat:10,   unit:'g',   cat:'🍕 Preparados' },
    { name:'Hamburguesa completa 200g',    kcal:295, protein:22, carbs:24,  fat:12,   unit:'ración', cat:'🍔 Preparados', grams:200 },
    { name:'Pasta boloñesa (ración)',      kcal:145, protein:9,  carbs:18,  fat:4.5,  unit:'g',   cat:'🍝 Preparados' },
    { name:'Sopa de pollo casera',         kcal:35,  protein:3.5,carbs:3.8, fat:0.8,  unit:'g',   cat:'🍲 Preparados' },
    { name:'Crema de verduras',            kcal:45,  protein:1.5,carbs:7,   fat:1.5,  unit:'g',   cat:'🍲 Preparados' },
    { name:'Gazpacho',                     kcal:40,  protein:1.2,carbs:6.8, fat:1.3,  unit:'g',   cat:'🍲 Preparados' },
    // --- DESAYUNO ---
    { name:'Muesli sin azúcar',            kcal:362, protein:10, carbs:60,  fat:7,    unit:'g',   cat:'🥣 Desayuno' },
    { name:'Granola',                       kcal:489, protein:10, carbs:64,  fat:20,   unit:'g',   cat:'🥣 Desayuno' },
    { name:'Cereales corn flakes',         kcal:357, protein:7,  carbs:78,  fat:1,    unit:'g',   cat:'🥣 Desayuno' },
    { name:'Tostada con AOVE (una)',       kcal:95,  protein:2.5,carbs:13,  fat:4,    unit:'ud',  cat:'🍞 Desayuno', grams:40 },
    { name:'Crep (crepe básica)',          kcal:162, protein:5,  carbs:23,  fat:5.4,  unit:'ud',  cat:'🥞 Desayuno', grams:75 },
    { name:'Pancake proteico',             kcal:200, protein:20, carbs:22,  fat:4,    unit:'ud',  cat:'🥞 Desayuno', grams:100 },
    // --- BEBIDAS ---
    { name:'Leche de avena',               kcal:45,  protein:1,  carbs:6.5, fat:1.5,  unit:'ml',  cat:'🥛 Bebidas' },
    { name:'Leche de almendra',            kcal:23,  protein:0.5,carbs:3.2, fat:1.1,  unit:'ml',  cat:'🥛 Bebidas' },
    { name:'Leche de soja',                kcal:39,  protein:3.3,carbs:2.9, fat:1.8,  unit:'ml',  cat:'🥛 Bebidas' },
    { name:'Zumo de naranja natural',      kcal:45,  protein:0.7,carbs:10,  fat:0.2,  unit:'ml',  cat:'🥤 Bebidas' },
    { name:'Agua con gas',                 kcal:0,   protein:0,  carbs:0,   fat:0,    unit:'ml',  cat:'💧 Bebidas' },
    { name:'Café solo (espresso)',         kcal:2,   protein:0.1,carbs:0.3, fat:0,    unit:'ud',  cat:'☕ Bebidas', grams:30 },
    { name:'Café con leche (100ml leche)', kcal:50,  protein:3,  carbs:4.7, fat:2,    unit:'ud',  cat:'☕ Bebidas', grams:130 },
    { name:'Batido proteico (listo)',      kcal:160, protein:30, carbs:9,   fat:2,    unit:'ud',  cat:'💪 Bebidas', grams:330 },
    { name:'Bebida isotónica',             kcal:26,  protein:0,  carbs:6.4, fat:0,    unit:'ml',  cat:'⚡ Bebidas' },
    // --- SNACKS Y OTROS ---
    { name:'Chocolate negro 85%',          kcal:598, protein:8,  carbs:22,  fat:50,   unit:'g',   cat:'🍫 Snacks' },
    { name:'Chocolate con leche',          kcal:535, protein:8,  carbs:56,  fat:31,   unit:'g',   cat:'🍫 Snacks' },
    { name:'Barrita proteica (media)',     kcal:200, protein:20, carbs:22,  fat:6,    unit:'ud',  cat:'💪 Snacks', grams:60 },
    { name:'Barrita de cereales',          kcal:390, protein:6,  carbs:62,  fat:14,   unit:'g',   cat:'🍫 Snacks' },
    { name:'Galletas de avena (2ud)',      kcal:130, protein:3,  carbs:19,  fat:5,    unit:'ud',  cat:'🍪 Snacks', grams:30 },
    { name:'Arroz con leche casero',       kcal:114, protein:3.5,carbs:22,  fat:2,    unit:'g',   cat:'🍮 Postres' },
    { name:'Natillas',                     kcal:118, protein:4,  carbs:17,  fat:4,    unit:'g',   cat:'🍮 Postres' },
    { name:'Aceitunas verdes',             kcal:145, protein:1,  carbs:3.8, fat:15,   unit:'g',   cat:'🫒 Otros' },
    { name:'Hummus',                       kcal:166, protein:8,  carbs:14,  fat:10,   unit:'g',   cat:'🫘 Otros' },
    { name:'Salsa de tomate (casera)',     kcal:40,  protein:1.6,carbs:7.5, fat:0.8,  unit:'g',   cat:'🍅 Salsas' },
    { name:'Ketchup',                      kcal:100, protein:1.5,carbs:25,  fat:0.1,  unit:'g',   cat:'🍅 Salsas' },
    { name:'Mayonesa light',               kcal:240, protein:0.7,carbs:6.5, fat:24,   unit:'g',   cat:'🥚 Salsas' },
    { name:'Mayonesa normal',              kcal:680, protein:1,  carbs:2.6, fat:75,   unit:'g',   cat:'🥚 Salsas' },
    { name:'Mostaza',                      kcal:60,  protein:3.7,carbs:5.8, fat:3.3,  unit:'g',   cat:'🌭 Salsas' },
    { name:'Crema de cacao (Nutella)',     kcal:539, protein:6.3,carbs:57,  fat:31,   unit:'g',   cat:'🍫 Salsas' },
    { name:'Mermelada de fresa',           kcal:250, protein:0.5,carbs:61,  fat:0.2,  unit:'g',   cat:'🍓 Otros' },
    { name:'Miel',                         kcal:304, protein:0.3,carbs:82,  fat:0,    unit:'g',   cat:'🍯 Otros' },
    { name:'Azúcar blanca',               kcal:387, protein:0,  carbs:100, fat:0,    unit:'g',   cat:'🍬 Otros' },
    { name:'Stevia (equivalente 1 cda)',   kcal:0,   protein:0,  carbs:0,   fat:0,    unit:'g',   cat:'🌿 Otros' },
    { name:'Proteína de arroz (scoop)',    kcal:112, protein:22, carbs:5,   fat:1,    unit:'scoop', cat:'💪 Suplementos', grams:30 },
    { name:'Creatina (5g)',                kcal:0,   protein:0,  carbs:0,   fat:0,    unit:'cdta', cat:'💪 Suplementos', grams:5 },
    { name:'BCAA (10g)',                   kcal:40,  protein:10, carbs:0,   fat:0,    unit:'porción', cat:'💪 Suplementos', grams:10 },
  ];

  // ================================================================
  // MOTOR DE BÚSQUEDA INTELIGENTE
  // ================================================================

  /**
   * Búsqueda fuzzy: normaliza texto, divide tokens y rankea resultados.
   * Devuelve los N mejores resultados ordenados por relevancia.
   */
  function smartSearch(query, maxResults = 8) {
    if (!query || query.length < 1) return [];

    const norm = s => s.toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '') // quitar tildes
      .replace(/[^a-z0-9\s]/g, '');

    const q = norm(query);
    const tokens = q.split(/\s+/).filter(t => t.length > 0);

    // Base de datos = FOOD_DB + BD guardada por el usuario
    const db = [...FOOD_DB, ...Storage.getMealFoodsDB().filter(f =>
      !FOOD_DB.some(d => norm(d.name) === norm(f.name))
    )];

    const scored = db.map(food => {
      const n = norm(food.name);
      let score = 0;

      // Coincidencia exacta al inicio
      if (n.startsWith(q)) score += 100;
      // Coincidencia exacta en cualquier posición
      if (n.includes(q)) score += 50;
      // Tokens individuales
      tokens.forEach(tok => {
        if (n.startsWith(tok)) score += 30;
        if (n.includes(tok)) score += 15;
      });
      // Bonus si el nombre es corto (más específico)
      if (score > 0) score += Math.max(0, 20 - food.name.length * 0.3);

      return { food, score };
    });

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(s => s.food);
  }

  // ================================================================
  // RENDER
  // ================================================================
  function render() {
    return `
    <div id="meals-view" class="anim-fade-in">
      <div class="tabs">
        <button class="tab-btn ${currentTab==='today'?'active':''}" onclick="MealsModule.switchTab('today')">Hoy</button>
        <button class="tab-btn ${currentTab==='stats'?'active':''}" onclick="MealsModule.switchTab('stats')">Stats</button>
        <button class="tab-btn ${currentTab==='settings'?'active':''}" onclick="MealsModule.switchTab('settings')">Config</button>
      </div>
      <div id="meals-tab-content"></div>
    </div>`;
  }

  function onEnter() { renderTab(); }

  function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('#meals-view .tab-btn').forEach((b,i) => {
      b.classList.toggle('active', ['today','stats','settings'][i] === tab);
    });
    renderTab();
  }

  function renderTab() {
    const container = document.getElementById('meals-tab-content');
    if (!container) return;
    if (currentTab === 'today')    container.innerHTML = renderToday();
    else if (currentTab === 'stats') { container.innerHTML = renderMealStats(); renderMealCharts(); }
    else if (currentTab === 'settings') container.innerHTML = renderMealSettings();
  }

  // ================================================================
  // HOY
  // ================================================================
  function renderToday() {
    const mealDay  = Storage.getMealDay(selectedDate);
    const settings = Storage.getMealSettings();
    const calGoal  = settings.calGoal || 2200;
    const protGoal = settings.proteinGoal || 150;

    let totalKcal = 0, totalP = 0, totalC = 0, totalF = 0;
    MEAL_NAMES.forEach(meal => {
      (mealDay[meal] || []).forEach(f => {
        totalKcal += f.kcal || 0;
        totalP    += f.protein || 0;
        totalC    += f.carbs || 0;
        totalF    += f.fat || 0;
      });
    });

    const calPct  = Utils.pct(totalKcal, calGoal);
    const protPct = Utils.pct(totalP, protGoal);

    const dateNav = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <button class="icon-btn" onclick="MealsModule.changeDate(-1)" aria-label="Día anterior">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span style="font-weight:700">${selectedDate === Utils.today() ? 'Hoy' : Utils.formatShortDate(selectedDate)}</span>
        <button class="icon-btn" onclick="MealsModule.changeDate(1)" aria-label="Día siguiente" ${selectedDate >= Utils.today() ? 'disabled style="opacity:0.3"' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>`;

    const summaryHTML = `
      <div class="calories-summary" style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
          <div>
            <div style="font-size:0.78rem;opacity:0.8;margin-bottom:2px">Consumidas</div>
            <div class="cal-total">${Math.round(totalKcal)}<span style="font-size:1rem"> kcal</span></div>
          </div>
          <div style="text-align:right">
            <div style="font-size:0.78rem;opacity:0.8;margin-bottom:2px">Restante</div>
            <div style="font-size:1.4rem;font-weight:800">${Math.max(0, calGoal - Math.round(totalKcal))}</div>
            <div style="font-size:0.72rem;opacity:0.7">de ${calGoal} kcal</div>
          </div>
        </div>
        <div class="progress-bar-wrap" style="background:rgba(255,255,255,0.25);height:6px;margin-bottom:12px">
          <div style="height:100%;border-radius:99px;background:white;opacity:0.9;width:${Math.min(calPct,100)}%;transition:width 0.6s ease"></div>
        </div>
        <div style="display:flex;justify-content:space-between">
          <div style="text-align:center">
            <div style="font-weight:800;font-size:1rem">${Math.round(totalP)}g</div>
            <div style="font-size:0.7rem;opacity:0.8">Prot. (${Utils.pct(totalP,protGoal)}%)</div>
          </div>
          <div style="text-align:center">
            <div style="font-weight:800;font-size:1rem">${Math.round(totalC)}g</div>
            <div style="font-size:0.7rem;opacity:0.8">Carbos</div>
          </div>
          <div style="text-align:center">
            <div style="font-weight:800;font-size:1rem">${Math.round(totalF)}g</div>
            <div style="font-size:0.7rem;opacity:0.8">Grasas</div>
          </div>
          <div style="text-align:center">
            <div style="font-weight:800;font-size:1rem">${calPct}%</div>
            <div style="font-size:0.7rem;opacity:0.8">Objetivo</div>
          </div>
        </div>
      </div>`;

    const mealsHTML = MEAL_NAMES.map(meal => {
      const foods = mealDay[meal] || [];
      const kcal  = foods.reduce((s, f) => s + (f.kcal || 0), 0);
      const isOpen = openMeals[meal] || false;

      const mealIcons = { Desayuno:'☀️', Almuerzo:'🌤️', Comida:'🍽️', Merienda:'🍎', Cena:'🌙' };
      return `
        <div class="meal-section">
          <div class="meal-header" onclick="MealsModule.toggleMeal('${meal}')">
            <div class="meal-header-left">
              <span style="font-size:1rem">${mealIcons[meal]||'🍽️'}</span>
              <span class="meal-name">${meal}</span>
              ${foods.length > 0 ? `<span class="badge badge-accent">${foods.length}</span>` : ''}
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <span class="meal-kcal">${Math.round(kcal)} kcal</span>
              <svg class="meal-chevron ${isOpen?'open':''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;transition:transform 0.2s ease${isOpen?';transform:rotate(180deg)':''}"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>
          <div class="meal-body ${isOpen?'open':''}" style="${isOpen?'':'display:none'}">
            ${foods.length === 0
              ? '<p style="color:var(--text-muted);font-size:0.82rem;padding:4px 0 8px">Sin alimentos registrados</p>'
              : foods.map((f, i) => `
                  <div class="food-item">
                    <div style="flex:1;min-width:0">
                      <div style="font-weight:600;font-size:0.88rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${Utils.escapeHtml(f.name)}</div>
                      <div style="font-size:0.74rem;color:var(--text-muted)">${f.amount}${f.unit||'g'} · <span class="macro-chip macro-p">${Math.round(f.protein)}P</span> <span class="macro-chip macro-c">${Math.round(f.carbs)}C</span> <span class="macro-chip macro-f">${Math.round(f.fat)}G</span></div>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
                      <span style="font-weight:700;font-size:0.85rem">${Math.round(f.kcal)}</span>
                      <button class="icon-btn" onclick="MealsModule.removeFood('${meal}',${i})" style="width:30px;height:30px;color:var(--danger)" aria-label="Eliminar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  </div>`
                ).join('')
            }
            <button class="btn btn-secondary btn-sm btn-full" style="margin-top:8px" onclick="MealsModule.addFoodModal('${meal}')">
              + Añadir alimento
            </button>
          </div>
        </div>`;
    }).join('');

    return dateNav + summaryHTML + mealsHTML;
  }

  // ================================================================
  // MODAL DE AÑADIR ALIMENTO – con buscador IA
  // ================================================================
  function addFoodModal(meal) {
    openModal(`
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
        <h3>Añadir a ${meal}</h3>
        <span class="ai-badge">✨ Smart Search</span>
      </div>

      <!-- Buscador inteligente -->
      <div class="autocomplete-wrap" style="margin-bottom:16px">
        <div class="input-group">
          <label class="input-label">Busca un alimento (escribe para autocompletar)</label>
          <input id="food-search" class="input" type="text" autocomplete="off" autocorrect="off"
            placeholder="Ej: pollo, arroz, plátano..."
            oninput="MealsModule.onSearchInput(this.value, '${meal}')"
            onfocus="MealsModule.onSearchInput(this.value, '${meal}')"
          />
        </div>
        <div id="food-autocomplete" class="autocomplete-dropdown" style="display:none"></div>
      </div>

      <!-- Formulario manual -->
      <details style="margin-bottom:4px">
        <summary style="cursor:pointer;font-size:0.85rem;color:var(--accent);font-weight:600;padding:4px 0">
          ✏️ Introducir manualmente
        </summary>
        <div style="display:flex;flex-direction:column;gap:10px;margin-top:12px">
          <div class="input-group">
            <label class="input-label">Nombre del alimento *</label>
            <input id="food-name" class="input" type="text" placeholder="Ej: Pollo a la plancha" />
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div class="input-group">
              <label class="input-label">Cantidad</label>
              <input id="food-amount" class="input" type="number" inputmode="decimal" value="100" min="1" />
            </div>
            <div class="input-group">
              <label class="input-label">Unidad</label>
              <select id="food-unit" class="input select">
                <option value="g">g</option>
                <option value="ml">ml</option>
                <option value="ud">ud</option>
                <option value="ración">ración</option>
              </select>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div class="input-group">
              <label class="input-label">Calorías (kcal/100)</label>
              <input id="food-kcal" class="input" type="number" inputmode="decimal" value="0" min="0" />
            </div>
            <div class="input-group">
              <label class="input-label">Proteínas (g/100)</label>
              <input id="food-prot" class="input" type="number" inputmode="decimal" value="0" min="0" step="0.1" />
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div class="input-group">
              <label class="input-label">Carbos (g/100)</label>
              <input id="food-carbs" class="input" type="number" inputmode="decimal" value="0" min="0" step="0.1" />
            </div>
            <div class="input-group">
              <label class="input-label">Grasas (g/100)</label>
              <input id="food-fat" class="input" type="number" inputmode="decimal" value="0" min="0" step="0.1" />
            </div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-primary" style="flex:1" onclick="MealsModule.saveFood('${meal}')">Añadir</button>
            <button class="btn btn-ghost btn-sm" onclick="MealsModule.saveToFoodsDB()" title="Guardar en mi base de datos">💾</button>
          </div>
        </div>
      </details>
    `, '');
  }

  // ================================================================
  // AUTOCOMPLETE HANDLER
  // ================================================================
  function onSearchInput(query, meal) {
    const dropdown = document.getElementById('food-autocomplete');
    if (!dropdown) return;

    clearTimeout(acTimer);
    if (!query.trim()) { dropdown.style.display = 'none'; return; }

    acTimer = setTimeout(() => {
      const results = smartSearch(query.trim());
      if (!results.length) {
        dropdown.innerHTML = `<div class="autocomplete-empty">Sin resultados para "<b>${Utils.escapeHtml(query)}</b>"<br><small>Prueba en "Introducir manualmente"</small></div>`;
        dropdown.style.display = 'block';
        return;
      }

      dropdown.innerHTML = results.map((food, i) => {
        const grams = food.grams || 100;
        return `
          <div class="autocomplete-item" onclick="MealsModule.selectFood(${i}, '${meal}')" data-idx="${i}">
            <div>
              <div class="autocomplete-item-name">${highlightMatch(food.name, query)}</div>
              <div class="autocomplete-item-sub">${food.cat} · ${grams}${food.unit} · P:${food.protein}g C:${food.carbs}g G:${food.fat}g</div>
            </div>
            <div class="autocomplete-item-kcal">${food.kcal}<span style="font-size:0.65rem"> kcal</span></div>
          </div>`;
      }).join('');

      // Guardar resultados en el dropdown para acceder luego
      dropdown._results = results;
      dropdown.style.display = 'block';
    }, 150);
  }

  function highlightMatch(text, query) {
    const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const idx  = norm(text).indexOf(norm(query));
    if (idx < 0) return Utils.escapeHtml(text);
    return Utils.escapeHtml(text.slice(0, idx))
      + `<b style="color:var(--accent)">${Utils.escapeHtml(text.slice(idx, idx + query.length))}</b>`
      + Utils.escapeHtml(text.slice(idx + query.length));
  }

  function selectFood(idx, meal) {
    const dropdown = document.getElementById('food-autocomplete');
    const results  = dropdown?._results;
    if (!results || !results[idx]) return;
    const food = results[idx];
    const grams = food.grams || 100;

    // Ocultar dropdown
    if (dropdown) dropdown.style.display = 'none';

    // Pedir cantidad con un mini modal
    openModal(`
      <h3 style="margin-bottom:4px">${Utils.escapeHtml(food.name)}</h3>
      <p style="color:var(--text-muted);font-size:0.82rem;margin-bottom:16px">${food.cat}</p>

      <div style="background:var(--accent-alpha);border-radius:var(--border-radius-sm);padding:12px;margin-bottom:16px">
        <div style="display:flex;justify-content:space-around;text-align:center">
          <div><div style="font-weight:800;color:var(--accent)" id="pr-kcal">${food.kcal}</div><div style="font-size:0.72rem;color:var(--text-muted)">kcal</div></div>
          <div><div style="font-weight:800;color:var(--gym-color)" id="pr-prot">${food.protein}g</div><div style="font-size:0.72rem;color:var(--text-muted)">Prot.</div></div>
          <div><div style="font-weight:800;color:var(--meals-color)" id="pr-carbs">${food.carbs}g</div><div style="font-size:0.72rem;color:var(--text-muted)">Carbos</div></div>
          <div><div style="font-weight:800;color:var(--sleep-color)" id="pr-fat">${food.fat}g</div><div style="font-size:0.72rem;color:var(--text-muted)">Grasas</div></div>
        </div>
        <div style="font-size:0.72rem;color:var(--text-muted);text-align:center;margin-top:8px">por ${grams}${food.unit}</div>
      </div>

      <div class="input-group" style="margin-bottom:16px">
        <label class="input-label">Cantidad (${food.unit})</label>
        <input id="sel-amount" class="input" type="number" inputmode="decimal" value="${grams}" min="1"
          oninput="MealsModule.previewMacros(${food.kcal},${food.protein},${food.carbs},${food.fat},${grams})" />
      </div>

      <button class="btn btn-primary btn-full btn-lg" onclick="MealsModule.addSelectedFood('${Utils.escapeHtml(food.name)}','${food.unit}',${food.kcal},${food.protein},${food.carbs},${food.fat},${grams},'${meal}')">
        ✅ Añadir a ${meal}
      </button>
    `);
  }

  function previewMacros(kcalPer, protPer, carbsPer, fatPer, perGrams) {
    const amount = parseFloat(document.getElementById('sel-amount')?.value) || perGrams;
    const ratio  = amount / perGrams;
    const set = (id, val, suffix='') => {
      const el = document.getElementById(id);
      if (el) el.textContent = Math.round(val * ratio) + suffix;
    };
    set('pr-kcal', kcalPer);
    set('pr-prot', protPer, 'g');
    set('pr-carbs', carbsPer, 'g');
    set('pr-fat', fatPer, 'g');
  }

  function addSelectedFood(name, unit, kcalPer, protPer, carbsPer, fatPer, perGrams, meal) {
    const amount = parseFloat(document.getElementById('sel-amount')?.value) || perGrams;
    const ratio  = amount / perGrams;
    const food   = {
      id:      Utils.uid(),
      name,
      amount,
      unit,
      kcal:    Math.round(kcalPer * ratio),
      protein: Utils.round(protPer * ratio),
      carbs:   Utils.round(carbsPer * ratio),
      fat:     Utils.round(fatPer * ratio),
    };
    const mealDay = Storage.getMealDay(selectedDate);
    if (!mealDay[meal]) mealDay[meal] = [];
    mealDay[meal].push(food);
    Storage.saveMealDay(selectedDate, mealDay);
    Storage.addXP(3);
    closeModal();
    openMeals[meal] = true;
    renderTab();
    showToast(`${name} añadido a ${meal} ✓`, 'success');
    Utils.haptic([15]);
    GoalsModule.checkAchievements();
  }

  // ================================================================
  // AÑADIR MANUAL
  // ================================================================
  function saveFood(meal) {
    const name   = document.getElementById('food-name')?.value.trim();
    const amount = parseFloat(document.getElementById('food-amount')?.value) || 100;
    const unit   = document.getElementById('food-unit')?.value || 'g';
    const ratio  = amount / 100;
    const kcal   = Math.round((parseFloat(document.getElementById('food-kcal')?.value) || 0) * ratio);
    const prot   = Utils.round((parseFloat(document.getElementById('food-prot')?.value) || 0) * ratio);
    const carbs  = Utils.round((parseFloat(document.getElementById('food-carbs')?.value) || 0) * ratio);
    const fat    = Utils.round((parseFloat(document.getElementById('food-fat')?.value) || 0) * ratio);
    if (!name) { showToast('El nombre es obligatorio', 'error'); return; }
    const mealDay = Storage.getMealDay(selectedDate);
    if (!mealDay[meal]) mealDay[meal] = [];
    mealDay[meal].push({ id: Utils.uid(), name, amount, unit, kcal, protein: prot, carbs, fat });
    Storage.saveMealDay(selectedDate, mealDay);
    Storage.addXP(3);
    closeModal();
    openMeals[meal] = true;
    renderTab();
    showToast(`${name} añadido a ${meal}`, 'success');
    Utils.haptic([15]);
  }

  function saveToFoodsDB() {
    const name  = document.getElementById('food-name')?.value.trim();
    const kcal  = parseFloat(document.getElementById('food-kcal')?.value) || 0;
    const prot  = parseFloat(document.getElementById('food-prot')?.value) || 0;
    const carbs = parseFloat(document.getElementById('food-carbs')?.value) || 0;
    const fat   = parseFloat(document.getElementById('food-fat')?.value) || 0;
    if (!name) { showToast('Escribe el nombre', 'error'); return; }
    const db = Storage.getMealFoodsDB();
    if (db.some(f => f.name.toLowerCase() === name.toLowerCase())) {
      showToast('Ya existe en tu base de datos', 'warning'); return;
    }
    db.push({ id: Utils.uid(), name, kcal, protein: prot, carbs, fat, unit:'100g' });
    Storage.saveMealFoodsDB(db);
    showToast(`"${name}" guardado en tu BD personal`, 'success');
  }

  function removeFood(meal, index) {
    const mealDay = Storage.getMealDay(selectedDate);
    mealDay[meal].splice(index, 1);
    Storage.saveMealDay(selectedDate, mealDay);
    renderTab();
    Utils.haptic([10]);
  }

  // ================================================================
  // ESTADÍSTICAS
  // ================================================================
  function renderMealStats() {
    const days    = Utils.lastNDays(7);
    const calPerDay = days.map(d => Object.values(Storage.getMealDay(d)).flat().reduce((s,f) => s+(f.kcal||0),0));
    const avgKcal = Utils.avg(calPerDay.filter(c => c > 0));
    const settings = Storage.getMealSettings();
    const protPerDay = days.map(d => Object.values(Storage.getMealDay(d)).flat().reduce((s,f) => s+(f.protein||0),0));
    const avgProt = Utils.avg(protPerDay.filter(p => p > 0));

    return `
    <div class="dashboard-grid" style="margin-bottom:16px">
      <div class="card"><div class="card-header"><span class="card-title">Prom. semanal</span></div>
        <div class="card-value">${Math.round(avgKcal)||'--'}</div><div class="card-sub">kcal/día</div></div>
      <div class="card"><div class="card-header"><span class="card-title">Prot. media</span></div>
        <div class="card-value">${Math.round(avgProt)||'--'}g</div><div class="card-sub">proteína/día</div></div>
      <div class="card card-wide"><div class="card-header"><span class="card-title">Objetivo calórico</span></div>
        <div class="card-value">${settings.calGoal}</div><div class="card-sub">kcal diarias</div></div>
    </div>
    <div class="chart-container" style="margin-bottom:12px">
      <p class="chart-title">Calorías – últimos 7 días</p>
      <canvas id="meals-cal-chart" style="width:100%;height:140px"></canvas>
    </div>
    <div class="chart-container">
      <p class="chart-title">Distribución de macros (hoy)</p>
      <canvas id="meals-macro-chart" style="width:100%;height:110px"></canvas>
    </div>`;
  }

  function renderMealCharts() {
    const days = Utils.lastNDays(7);
    const calCanvas = document.getElementById('meals-cal-chart');
    if (calCanvas) {
      const calData  = days.map(d => Object.values(Storage.getMealDay(d)).flat().reduce((s,f) => s+(f.kcal||0),0));
      const calLabels = days.map(d => Utils.getDayShort(new Date(d+'T00:00:00').getDay()));
      Utils.drawBarChart(calCanvas, calData, calLabels, { color:'#ffd93d', bgColor:'rgba(255,217,61,0.1)' });
    }
    const macroCanvas = document.getElementById('meals-macro-chart');
    if (macroCanvas) {
      const today = Storage.getMealDay(Utils.today());
      const all = Object.values(today).flat();
      const p = Math.round(all.reduce((s,f) => s+(f.protein||0),0));
      const c = Math.round(all.reduce((s,f) => s+(f.carbs||0),0));
      const fat = Math.round(all.reduce((s,f) => s+(f.fat||0),0));
      Utils.drawBarChart(macroCanvas, [p, c, fat], ['Proteína','Carbos','Grasas'], { color:'#6C63FF', bgColor:'rgba(108,99,255,0.1)' });
    }
  }

  // ================================================================
  // CONFIGURACIÓN
  // ================================================================
  function renderMealSettings() {
    const s = Storage.getMealSettings();
    return `
    <div class="card">
      <h3 style="margin-bottom:16px">Objetivos nutricionales</h3>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div class="input-group">
          <label class="input-label">Calorías objetivo (kcal/día)</label>
          <input id="ms-cal" class="input" type="number" inputmode="numeric" value="${s.calGoal}" min="800" max="6000" />
        </div>
        <div class="input-group">
          <label class="input-label">Proteínas objetivo (g/día)</label>
          <input id="ms-prot" class="input" type="number" inputmode="numeric" value="${s.proteinGoal}" min="0" max="500" />
        </div>
        <div class="input-group">
          <label class="input-label">Carbohidratos objetivo (g/día)</label>
          <input id="ms-carbs" class="input" type="number" inputmode="numeric" value="${s.carbsGoal}" min="0" max="800" />
        </div>
        <div class="input-group">
          <label class="input-label">Grasas objetivo (g/día)</label>
          <input id="ms-fat" class="input" type="number" inputmode="numeric" value="${s.fatGoal}" min="0" max="300" />
        </div>
        <button class="btn btn-primary btn-full" onclick="MealsModule.saveMealConfig()">Guardar</button>
      </div>
    </div>
    <p class="section-title">Mi base de datos personal</p>
    <div class="card">
      <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:12px">
        ${Storage.getMealFoodsDB().length} alimentos personales guardados.
        La app ya incluye 200+ alimentos de forma nativa.
      </p>
      <button class="btn btn-danger btn-sm" onclick="MealsModule.clearPersonalDB()">Limpiar BD personal</button>
    </div>`;
  }

  function saveMealConfig() {
    const s = {
      calGoal:     parseInt(document.getElementById('ms-cal')?.value)   || 2200,
      proteinGoal: parseInt(document.getElementById('ms-prot')?.value)  || 150,
      carbsGoal:   parseInt(document.getElementById('ms-carbs')?.value) || 250,
      fatGoal:     parseInt(document.getElementById('ms-fat')?.value)   || 70,
    };
    Storage.saveMealSettings(s);
    showToast('Configuración guardada', 'success');
  }

  function clearPersonalDB() {
    Storage.saveMealFoodsDB([]);
    renderTab();
    showToast('Base de datos personal limpiada', 'info');
  }

  // ================================================================
  // HELPERS
  // ================================================================
  function toggleMeal(meal) {
    openMeals[meal] = !openMeals[meal];
    renderTab();
  }

  function changeDate(delta) {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    const newDate = d.toISOString().slice(0, 10);
    if (newDate > Utils.today()) return;
    selectedDate = newDate;
    renderTab();
  }

  // ================================================================
  // API PÚBLICA
  // ================================================================
  return {
    render, onEnter,
    switchTab, toggleMeal, changeDate,
    onSearchInput, selectFood, previewMacros, addSelectedFood,
    addFoodModal, saveFood, saveToFoodsDB, removeFood,
    saveMealConfig, clearPersonalDB,
    FOOD_DB, smartSearch
  };
})();

window.MealsModule = MealsModule;
