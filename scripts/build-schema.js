/**
 * Build data/auditData.json from the 5S schema (all headers from 5S.xlsx).
 * Creates ONE demo audit row so the app can be tested.
 * Usage: node scripts/build-schema.js
 */
const fs = require('fs');
const path = require('path');

const HEADERS = [
  'ID','Heure de début','Heure de fin','Adresse de messagerie','Nom','Total points','Quiz feedback',
  'Heure de la dernière modification','Date','Points - Date','Feedback - Date',
  'Auditeur','Points - Auditeur','Feedback - Auditeur',
  'Zone/Ligne','Points - Zone/Ligne','Feedback - Zone/Ligne',
  'Pilot de zone','Points - Pilot de zone','Feedback - Pilot de zone',
  "Pas d'objets inutiles (objets, outils, matériaux) non liés au processus/ production en cours (également dans les armoires, casiers)",
  "Points - Pas d'objets inutiles (objets, outils, matériaux) non liés au processus/ production en cours (également dans les armoires, casiers)",
  "Feedback - Pas d'objets inutiles (objets, outils, matériaux) non liés au processus/ production en cours (également dans les armoires, casiers)",
  'Action','Points - Action','Feedback - Action',
  "Pas d'affichages inutiles","Points - Pas d'affichages inutiles","Feedback - Pas d'affichages inutiles",
  'Action2','Points - Action2','Feedback - Action2',
  'Les équipements et outillages partagés par plusieurs lignes/postes sont placés dans un espace commun',
  'Feedback - Les équipements et outillages partagés par plusieurs lignes/postes sont placés dans un espace commun',
  'Points - Les équipements et outillages partagés par plusieurs lignes/postes sont placés dans un espace commun',
  'Action3','Feedback - Action3','Points - Action3',
  "Pas d'objet, outillage, matériel, produit chimique,… présentant un risque sécurité",
  "Feedback - Pas d'objet, outillage, matériel, produit chimique,… présentant un risque sécurité",
  "Points - Pas d'objet, outillage, matériel, produit chimique,… présentant un risque sécurité",
  'Action4','Feedback - Action4','Points - Action4',
  'Tous les éléments mobiles (outillage, gabarit)) ont un emplacement de stockage défini',
  'Feedback - Tous les éléments mobiles (outillage, gabarit)) ont un emplacement de stockage défini',
  'Points - Tous les éléments mobiles (outillage, gabarit)) ont un emplacement de stockage défini',
  'Action5','Feedback - Action5','Points - Action5',
  "Les objets fréquemment utilisés sont situés à proximité de leur point d'utilisation",
  "Feedback - Les objets fréquemment utilisés sont situés à proximité de leur point d'utilisation",
  "Points - Les objets fréquemment utilisés sont situés à proximité de leur point d'utilisation",
  'Action6','Points - Action6','Feedback - Action6',
  "Chaque chose à sa place, lorsqu'elle n'est pas utilisée",
  "Points - Chaque chose à sa place, lorsqu'elle n'est pas utilisée",
  "Feedback - Chaque chose à sa place, lorsqu'elle n'est pas utilisée",
  'Action7','Points - Action7','Feedback - Action7',
  'Tous les objets sont dans leur état standard (armoires électriques, tiroirs, couvercles fermés, ,,,)',
  'Points - Tous les objets sont dans leur état standard (armoires électriques, tiroirs, couvercles fermés, ,,,)',
  'Feedback - Tous les objets sont dans leur état standard (armoires électriques, tiroirs, couvercles fermés, ,,,)',
  'Action8','Points - Action8','Feedback - Action8',
  'Un marquage au sol est réalisé','Points - Un marquage au sol est réalisé','Feedback - Un marquage au sol est réalisé',
  'Action9','Points - Action9','Feedback - Action9',
  'Accès libre au matériel incendie et issues de secours',
  'Points -  Accès libre au matériel incendie et issues de secours',
  'Feedback -  Accès libre au matériel incendie et issues de secours',
  'Action10','Points - Action10','Feedback - Action10',
  'La zone de travail est propre et en bon état : sol, zoning, machines et équipements, câbles, outillages, conteneurs,postes et table de contrôle, documentation, armoires, racks, étagères, panneaux ...',
  'Points - La zone de travail est propre et en bon état : sol, zoning, machines et équipements, câbles, outillages, conteneurs,postes et table de contrôle, documentation, armoires, racks, étagères, panneaux ...',
  'Feedback - La zone de travail est propre et en bon état : sol, zoning, machines et équipements, câbles, outillages, conteneurs,postes et table de contrôle, documentation, armoires, racks, étagères, panneaux ...',
  'Action11','Points - Action11','Feedback - Action11',
  "Les sources de saleté (fuite d'eau, d'huile) sont détectées et assignée pour l'élimination",
  "Points - Les sources de saleté (fuite d'eau, d'huile) sont détectées et assignée pour l'élimination",
  "Feedback - Les sources de saleté (fuite d'eau, d'huile) sont détectées et assignée pour l'élimination",
  'Action12','Points - Action12','Feedback - Action12',
  'Kit de nettoyage disponible, accessible et adapté',
  'Points - Kit de nettoyage disponible, accessible et adapté',
  'Feedback - Kit de nettoyage disponible, accessible et adapté',
  'Action13','Points - Action13','Feedback - Action13',
  'Tri sélectif du déchets / rebuts est respecté',
  'Points - Tri sélectif du déchets / rebuts est respecté',
  'Feedback - Tri sélectif du déchets / rebuts est respecté',
  'Action14','Feedback - Action14','Points - Action14',
  'Chaque lieu de stockage défini pour un objet mobile (outillage, gabarit de contrôle,...) est identifié',
  'Feedback - Chaque lieu de stockage défini pour un objet mobile (outillage, gabarit de contrôle,...) est identifié',
  'Points - Chaque lieu de stockage défini pour un objet mobile (outillage, gabarit de contrôle,...) est identifié',
  'Action15','Feedback - Action15','Points - Action15',
  'Les conditions standards Visuel 5S du périmètre sont respectés (y compris les armoires, tiroirs, luminaires et surfaces en contact direct avec le produit)',
  'Feedback - Les conditions standards Visuel 5S du périmètre sont respectés (y compris les armoires, tiroirs, luminaires et surfaces en contact direct avec le produit)',
  'Points - Les conditions standards Visuel 5S du périmètre sont respectés (y compris les armoires, tiroirs, luminaires et surfaces en contact direct avec le produit)',
  'Action16','Feedback - Action16','Points - Action16',
  'Tous les objets/ contenants (y compris pour déchets) sont clairement identifiés',
  'Feedback - Tous les objets/ contenants (y compris pour déchets) sont clairement identifiés',
  'Points - Tous les objets/ contenants (y compris pour déchets) sont clairement identifiés',
  'Action17','Feedback - Action17','Points - Action17',
  'Les instructions de nettoyage et de tri sélectif sont définis',
  'Feedback - Les instructions de nettoyage et de tri sélectif sont définis',
  'Points - Les instructions de nettoyage et de tri sélectif sont définis',
  'Action18','Feedback - Action18','Points - Action18',
  'Marquage des zones, des canalisations et des équipements est réalisé',
  'Feedback - Marquage des zones, des canalisations et des équipements est réalisé',
  'Points - Marquage des zones, des canalisations et des équipements est réalisé',
  'Action19','Feedback - Action19','Points - Action19',
  'Un standard de kit de nettoyage est défini et est disponible',
  'Feedback - Un standard de kit de nettoyage est défini et est disponible',
  'Points - Un standard de kit de nettoyage est défini et est disponible',
  'Action20','Feedback - Action20','Points - Action20',
  'Un affichage visuel défini le standard du port des EPI',
  'Feedback - Un affichage visuel défini le standard du port des EPI',
  'Points - Un affichage visuel défini le standard du port des EPI',
  'Action21','Feedback - Action21','Points - Action21',
  "Les standards définis dans la zone sont connues et respectées par tous les membres de l'équipe (y compris les nouveaux arrivants)",
  "Feedback - Les standards définis dans la zone sont connues et respectées par tous les membres de l'équipe (y compris les nouveaux arrivants)",
  "Points - Les standards définis dans la zone sont connues et respectées par tous les membres de l'équipe (y compris les nouveaux arrivants)",
  'Action22','Feedback - Action22','Points - Action22',
  'Présence et respect du planning 5S',
  'Feedback - Présence et respect du planning 5S',
  'Points - Présence et respect du planning 5S',
  'Action23','Feedback - Action23','Points - Action23',
  'Le personnel porte les EPI',
  'Feedback -  Le personnel porte les EPI',
  'Points -  Le personnel porte les EPI',
  'Action24','Feedback - Action24','Points - Action24',
  'Tableau de marche et indicateurs du tableau de bord à jour',
  'Feedback - Tableau de marche et indicateurs du tableau de bord à jour',
  'Points - Tableau de marche et indicateurs du tableau de bord à jour',
  'Action25','Feedback - Action25','Points - Action25',
  'Le flux de production (lay-out) est clair et respecté',
  'Feedback - Le flux de production (lay-out) est clair et respecté',
  'Points - Le flux de production (lay-out) est clair et respecté',
  'Action26','Feedback - Action26','Points - Action26',
];

// Two demo audits so the list view has content
const demoRow = (id, name, date, total, auditeur, zone, pilot) => {
  const row = {};
  for (const h of HEADERS) row[h] = '';
  row['ID'] = id;
  row['Heure de début'] = '08:00';
  row['Heure de fin'] = '09:00';
  row['Adresse de messagerie'] = 'auditeur@company.com';
  row['Nom'] = name;
  row['Total points'] = String(total);
  row['Quiz feedback'] = total >= 80 ? 'OK' : 'À améliorer';
  row['Heure de la dernière modification'] = `${date} 09:00`;
  row['Date'] = date;
  row['Auditeur'] = auditeur;
  row['Zone/Ligne'] = zone;
  row['Pilot de zone'] = pilot;

  // Fill every criterion with a demo score
  for (const h of HEADERS) {
    if (h.startsWith('Points - ')) {
      const isAction = /^Points - Action\d*$/.test(h);
      row[h] = isAction ? '5' : String(3 + (id % 3));
    }
    if (h.startsWith('Feedback - ')) {
      row[h] = total >= 80 ? 'RAS' : 'À revoir';
    }
  }
  // Meta points too
  row['Points - Date'] = '5';
  row['Points - Auditeur'] = '5';
  row['Points - Zone/Ligne'] = '5';
  row['Points - Pilot de zone'] = '5';
  row['Feedback - Date'] = 'RAS';
  row['Feedback - Auditeur'] = 'RAS';
  row['Feedback - Zone/Ligne'] = 'RAS';
  row['Feedback - Pilot de zone'] = 'RAS';
  return row;
};

const data = [
  demoRow(1, 'DUPONT Jean',  '2024-01-15', 85, 'A. Martin', 'Ligne 1', 'P. Durand'),
  demoRow(2, 'MARTIN Marie', '2024-01-16', 72, 'B. Leroy',  'Ligne 2', 'C. Petit'),
];

const OUTPUT = path.join(__dirname, '..', 'data', 'auditData.json');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, JSON.stringify(data, null, 2), 'utf8');

console.log(`✅ Wrote ${data.length} audit(s) with ${HEADERS.length} columns → ${OUTPUT}`);
