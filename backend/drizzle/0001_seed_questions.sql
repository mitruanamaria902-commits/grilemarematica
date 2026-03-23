INSERT INTO questions (id, subject, chapter, difficulty, text, option_a, option_b, option_c, option_d, correct_option, explanation, created_at) VALUES

-- ALGEBRĂ: Mulțimi
(gen_random_uuid(), 'Matematică', 'Mulțimi', 'ușor', 'Care dintre următoarele este mulțimea vidă?', '{x ∈ ℝ | x² = 1}', '{x ∈ ℝ | x² = -1}', '{x ∈ ℕ | x < 5}', '{x ∈ ℤ | x > -3}', 'b', 'Nu există număr real al cărui pătrat să fie negativ, deci mulțimea este vidă.', NOW()),

(gen_random_uuid(), 'Matematică', 'Mulțimi', 'ușor', 'Dacă A = {1, 2, 3} și B = {2, 3, 4}, atunci A ∩ B este:', '{1, 2, 3, 4}', '{1, 4}', '{2, 3}', '{1, 2, 3}', 'c', 'Intersecția conține elementele comune ambelor mulțimi: 2 și 3.', NOW()),

(gen_random_uuid(), 'Matematică', 'Mulțimi', 'mediu', 'Dacă A = {1, 2, 3, 4} și B = {3, 4, 5, 6}, atunci A ∪ B are câte elemente?', '4', '6', '8', '2', 'b', 'A ∪ B = {1, 2, 3, 4, 5, 6} are 6 elemente.', NOW()),

(gen_random_uuid(), 'Matematică', 'Mulțimi', 'mediu', 'Dacă A ⊂ B și B ⊂ A, atunci:', 'A și B sunt disjuncte', 'A = B', 'A este vidă', 'B este vidă', 'b', 'Dacă fiecare mulțime este inclusă în cealaltă, atunci ele sunt egale.', NOW()),

-- ALGEBRĂ: Numere reale
(gen_random_uuid(), 'Matematică', 'Numere reale', 'ușor', 'Care este valoarea lui √144?', '11', '12', '13', '14', 'b', '12² = 144, deci √144 = 12.', NOW()),

(gen_random_uuid(), 'Matematică', 'Numere reale', 'ușor', 'Cât este |−7| + |3|?', '4', '-4', '10', '-10', 'c', '|−7| = 7 și |3| = 3, deci suma este 10.', NOW()),

(gen_random_uuid(), 'Matematică', 'Numere reale', 'mediu', 'Care este forma simplificată a lui √75?', '5√3', '3√5', '25√3', '15√3', 'a', '√75 = √(25·3) = 5√3.', NOW()),

(gen_random_uuid(), 'Matematică', 'Numere reale', 'mediu', 'Cât este (√3 + 1)(√3 − 1)?', '2', '3', '4', '√3', 'a', 'Folosind formula (a+b)(a-b) = a²-b²: (√3)²-1² = 3-1 = 2.', NOW()),

(gen_random_uuid(), 'Matematică', 'Numere reale', 'dificil', 'Care este valoarea expresiei (2√2)³?', '8√2', '16√2', '6√2', '4√2', 'b', '(2√2)³ = 2³·(√2)³ = 8·2√2 = 16√2.', NOW()),

(gen_random_uuid(), 'Matematică', 'Numere reale', 'mediu', 'Dacă x = √5 − 2, atunci x² + 4x este egal cu:', '1', '5', '9', '0', 'a', 'x² = (√5-2)² = 9-4√5; 4x = 4√5-8; suma = 9-4√5+4√5-8 = 1.', NOW()),

-- ALGEBRĂ: Ecuații de gradul I
(gen_random_uuid(), 'Matematică', 'Ecuații de gradul I', 'ușor', 'Care este soluția ecuației 3x − 6 = 0?', 'x = 1', 'x = 2', 'x = 3', 'x = 6', 'b', '3x = 6, deci x = 2.', NOW()),

(gen_random_uuid(), 'Matematică', 'Ecuații de gradul I', 'ușor', 'Soluția ecuației 2x + 5 = 13 este:', 'x = 3', 'x = 4', 'x = 9', 'x = 6', 'b', '2x = 13 - 5 = 8, deci x = 4.', NOW()),

(gen_random_uuid(), 'Matematică', 'Ecuații de gradul I', 'mediu', 'Soluția ecuației 5(x − 2) = 3(x + 4) este:', 'x = 11', 'x = 13', 'x = 7', 'x = 9', 'a', '5x - 10 = 3x + 12; 2x = 22; x = 11.', NOW()),

(gen_random_uuid(), 'Matematică', 'Ecuații de gradul I', 'mediu', 'Dacă 4x − 3 = 2x + 7, atunci x este:', 'x = 2', 'x = 4', 'x = 5', 'x = 6', 'c', '4x - 2x = 7 + 3; 2x = 10; x = 5.', NOW()),

-- ALGEBRĂ: Ecuații de gradul II
(gen_random_uuid(), 'Matematică', 'Ecuații de gradul II', 'mediu', 'Soluțiile ecuației x² − 5x + 6 = 0 sunt:', 'x₁ = 1, x₂ = 6', 'x₁ = 2, x₂ = 3', 'x₁ = −2, x₂ = −3', 'x₁ = 1, x₂ = −6', 'b', 'Δ = 25 - 24 = 1; x = (5±1)/2; x₁ = 3, x₂ = 2.', NOW()),

(gen_random_uuid(), 'Matematică', 'Ecuații de gradul II', 'mediu', 'Discriminantul ecuației x² + 2x + 5 = 0 este:', '24', '-16', '−16', '4', 'b', 'Δ = b² - 4ac = 4 - 20 = -16. Ecuația nu are soluții reale.', NOW()),

(gen_random_uuid(), 'Matematică', 'Ecuații de gradul II', 'dificil', 'Suma soluțiilor ecuației 2x² − 6x + 4 = 0 este:', '2', '3', '4', '6', 'b', 'Prin teorema lui Viète: x₁ + x₂ = -b/a = 6/2 = 3.', NOW()),

(gen_random_uuid(), 'Matematică', 'Ecuații de gradul II', 'dificil', 'Produsul soluțiilor ecuației x² − 7x + 10 = 0 este:', '7', '10', '−10', '−7', 'b', 'Prin teorema lui Viète: x₁ · x₂ = c/a = 10/1 = 10.', NOW()),

-- ALGEBRĂ: Sisteme de ecuații
(gen_random_uuid(), 'Matematică', 'Sisteme de ecuații', 'mediu', 'Soluția sistemului {x + y = 5; x − y = 1} este:', 'x = 2, y = 3', 'x = 3, y = 2', 'x = 4, y = 1', 'x = 1, y = 4', 'b', 'Adunând: 2x = 6, x = 3; y = 5 - 3 = 2.', NOW()),

(gen_random_uuid(), 'Matematică', 'Sisteme de ecuații', 'mediu', 'Soluția sistemului {2x + y = 7; x − y = 2} este:', 'x = 2, y = 3', 'x = 3, y = 1', 'x = 4, y = -1', 'x = 1, y = 5', 'b', 'Adunând: 3x = 9, x = 3; y = 7 - 6 = 1.', NOW()),

(gen_random_uuid(), 'Matematică', 'Sisteme de ecuații', 'dificil', 'Soluția sistemului {3x − 2y = 4; x + y = 3} este:', 'x = 1, y = 2', 'x = 2, y = 1', 'x = 3, y = 0', 'x = 0, y = 3', 'b', 'Din a doua: x = 3 - y; înlocuind: 3(3-y) - 2y = 4; 9 - 5y = 4; y = 1; x = 2.', NOW()),

-- ALGEBRĂ: Funcții
(gen_random_uuid(), 'Matematică', 'Funcții', 'ușor', 'Funcția f: ℝ → ℝ, f(x) = 2x + 3. Cât este f(4)?', '8', '10', '11', '14', 'c', 'f(4) = 2·4 + 3 = 8 + 3 = 11.', NOW()),

(gen_random_uuid(), 'Matematică', 'Funcții', 'mediu', 'Graficul funcției f(x) = 3x − 2 intersectează axa Oy în punctul:', '(0, 3)', '(0, −2)', '(2/3, 0)', '(0, 2)', 'b', 'Intersecția cu Oy se obține pentru x = 0: f(0) = -2, deci punctul (0, -2).', NOW()),

(gen_random_uuid(), 'Matematică', 'Funcții', 'mediu', 'Dacă f(x) = x² − 4, atunci f(−3) este:', '5', '−5', '13', '−13', 'a', 'f(-3) = (-3)² - 4 = 9 - 4 = 5.', NOW()),

(gen_random_uuid(), 'Matematică', 'Funcții', 'dificil', 'Funcția f(x) = x² − 6x + 5 are valoarea minimă:', '−4', '−5', '0', '5', 'a', 'Vârful parabolei: x = 3; f(3) = 9 - 18 + 5 = -4.', NOW()),

-- GEOMETRIE: Triunghi
(gen_random_uuid(), 'Matematică', 'Triunghi', 'ușor', 'Suma unghiurilor unui triunghi este:', '90°', '180°', '270°', '360°', 'b', 'Suma unghiurilor interioare ale oricărui triunghi este 180°.', NOW()),

(gen_random_uuid(), 'Matematică', 'Triunghi', 'ușor', 'Într-un triunghi dreptunghic cu catetele 3 și 4, ipotenuza este:', '5', '6', '7', '√7', 'a', 'Prin teorema lui Pitagora: c² = 3² + 4² = 9 + 16 = 25, deci c = 5.', NOW()),

(gen_random_uuid(), 'Matematică', 'Triunghi', 'mediu', 'Aria unui triunghi cu baza 8 cm și înălțimea 5 cm este:', '20 cm²', '40 cm²', '13 cm²', '80 cm²', 'a', 'A = (b · h) / 2 = (8 · 5) / 2 = 20 cm².', NOW()),

(gen_random_uuid(), 'Matematică', 'Triunghi', 'mediu', 'Într-un triunghi isoscel, unghiurile de la bază sunt de 70° fiecare. Unghiul din vârf este:', '40°', '50°', '60°', '70°', 'a', '180° - 70° - 70° = 40°.', NOW()),

(gen_random_uuid(), 'Matematică', 'Triunghi', 'dificil', 'Mediana unui triunghi echilateral cu latura 6 cm are lungimea:', '3√3 cm', '3 cm', '6 cm', '2√3 cm', 'a', 'Mediana = (√3/2) · latura = (√3/2) · 6 = 3√3 cm.', NOW()),

-- GEOMETRIE: Patrulater
(gen_random_uuid(), 'Matematică', 'Patrulater', 'ușor', 'Aria unui pătrat cu latura 7 cm este:', '28 cm²', '49 cm²', '14 cm²', '21 cm²', 'b', 'A = l² = 7² = 49 cm².', NOW()),

(gen_random_uuid(), 'Matematică', 'Patrulater', 'ușor', 'Perimetrul unui dreptunghi cu lungimea 8 cm și lățimea 5 cm este:', '26 cm', '40 cm', '13 cm', '80 cm', 'a', 'P = 2(l + L) = 2(8 + 5) = 26 cm.', NOW()),

(gen_random_uuid(), 'Matematică', 'Patrulater', 'mediu', 'Diagonalele unui romb sunt de 6 cm și 8 cm. Aria rombului este:', '48 cm²', '24 cm²', '14 cm²', '28 cm²', 'b', 'A = (d₁ · d₂) / 2 = (6 · 8) / 2 = 24 cm².', NOW()),

(gen_random_uuid(), 'Matematică', 'Patrulater', 'mediu', 'Suma unghiurilor interioare ale unui patrulater este:', '180°', '270°', '360°', '540°', 'c', 'Suma unghiurilor interioare ale oricărui patrulater este 360°.', NOW()),

(gen_random_uuid(), 'Matematică', 'Patrulater', 'dificil', 'Aria unui trapez cu bazele 5 cm și 9 cm și înălțimea 4 cm este:', '28 cm²', '56 cm²', '14 cm²', '18 cm²', 'a', 'A = (b₁ + b₂) · h / 2 = (5 + 9) · 4 / 2 = 28 cm².', NOW()),

-- GEOMETRIE: Cerc
(gen_random_uuid(), 'Matematică', 'Cerc', 'ușor', 'Aria unui cerc cu raza 5 cm este:', '10π cm²', '25π cm²', '5π cm²', '50π cm²', 'b', 'A = π · r² = π · 25 = 25π cm².', NOW()),

(gen_random_uuid(), 'Matematică', 'Cerc', 'ușor', 'Lungimea unui cerc cu diametrul 10 cm este:', '10π cm', '5π cm', '20π cm', '100π cm', 'a', 'C = π · d = π · 10 = 10π cm.', NOW()),

(gen_random_uuid(), 'Matematică', 'Cerc', 'mediu', 'Un unghi înscris în cerc care se sprijină pe un diametru măsoară:', '45°', '60°', '90°', '180°', 'c', 'Orice unghi înscris care se sprijină pe un diametru este drept (90°) — teorema lui Thales.', NOW()),

(gen_random_uuid(), 'Matematică', 'Cerc', 'mediu', 'Dacă un arc de cerc are 120°, unghiul la centru corespunzător este:', '60°', '90°', '120°', '240°', 'c', 'Unghiul la centru este egal cu măsura arcului pe care îl interceptează.', NOW()),

-- GEOMETRIE: Geometrie în spațiu
(gen_random_uuid(), 'Matematică', 'Geometrie în spațiu', 'mediu', 'Volumul unui cub cu latura 3 cm este:', '9 cm³', '18 cm³', '27 cm³', '54 cm³', 'c', 'V = l³ = 3³ = 27 cm³.', NOW()),

(gen_random_uuid(), 'Matematică', 'Geometrie în spațiu', 'mediu', 'Aria laterală a unui cilindru cu raza 4 cm și înălțimea 5 cm este:', '20π cm²', '40π cm²', '80π cm²', '160π cm²', 'b', 'Al = 2π · r · h = 2π · 4 · 5 = 40π cm².', NOW()),

(gen_random_uuid(), 'Matematică', 'Geometrie în spațiu', 'dificil', 'Volumul unei sfere cu raza 3 cm este:', '9π cm³', '12π cm³', '36π cm³', '108π cm³', 'c', 'V = (4/3)π · r³ = (4/3)π · 27 = 36π cm³.', NOW()),

(gen_random_uuid(), 'Matematică', 'Geometrie în spațiu', 'dificil', 'Diagonala unui cub cu latura a este:', 'a√2', 'a√3', '2a', 'a√6', 'b', 'Diagonala cubului = a√3 (se calculează prin teorema lui Pitagora aplicată de două ori).', NOW())

ON CONFLICT (id) DO NOTHING;
