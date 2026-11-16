/* Données de règles — création par packages.
   Source : Traveller Companion Update 2024 (Mongoose), « Package-Based Creation ».
   Les caractéristiques, compétences et bénéfices sont repris des tables du livre.
   `priority` et `roles` sont des ajouts de l'outil (répartition des jets, habillage).

   Syntaxe des compétences :
     "Vacc Suit 1"                      compétence simple
     "Gun Combat (slug) 1"              spécialité imposée
     "Gun Combat (any) 1"               spécialité tirée au hasard
     "Electronics (comms/computers) 1"  spécialité tirée parmi celles listées
     "Drive (any) 1 / Flyer (any) 1"    une des deux compétences, au hasard
   Modificateurs : "STR +1, EDU -1".
   Bénéfices : "Cr 10000", "Rank 2 (corporal)", "Rifle / Carbine" (un au hasard),
               "SOC +1" (appliqué à la caractéristique). */
(function (root) {
  const data = {
    meta: {
      source: 'Traveller Companion Update 2024 — Package-Based Creation',
      version: 2,
    },

    rules: {
      characteristicMin: 1,
      characteristicMax: 15,
      maxSkillLevel: 4,
      stacking: 'add', // 'add' : les niveaux s'additionnent ; 'max' : on garde le plus haut
      baseAge: 22,
      careerAging: '3D',
      fixedArray: [9, 8, 7, 7, 6, 5], // option de l'outil, au choix de l'arbitre
    },

    // Compétences dont les spécialités sont libres (pas d'avertissement si hors catalogue).
    openSpecialties: ['Language', 'Profession'],

    // Variantes d'écriture du livre ramenées au nom du catalogue.
    specAliases: { starship: 'spacecraft', computer: 'computers' },

    skills: {
      Admin: [],
      Advocate: [],
      Animals: ['handling', 'veterinary', 'training'],
      Art: ['performer', 'holography', 'instrument', 'visual media', 'write'],
      Astrogation: [],
      Athletics: ['dexterity', 'endurance', 'strength'],
      Broker: [],
      Carouse: [],
      Deception: [],
      Diplomat: [],
      Drive: ['hovercraft', 'mole', 'track', 'walker', 'wheel'],
      Electronics: ['comms', 'computers', 'remote ops', 'sensors'],
      Engineer: ['m-drive', 'j-drive', 'life support', 'power'],
      Explosives: [],
      Flyer: ['airship', 'grav', 'ornithopter', 'rotor', 'wing'],
      Gambler: [],
      Gunner: ['turret', 'ortillery', 'screen', 'capital'],
      'Gun Combat': ['archaic', 'energy', 'slug'],
      'Heavy Weapons': ['artillery', 'portable', 'vehicle'],
      Investigate: [],
      'Jack-of-All-Trades': [],
      Language: ['Anglic', 'Vilani', 'Zdetl', 'Oynprith', 'Trokh', 'Gvegh'],
      Leadership: [],
      Mechanic: [],
      Medic: [],
      Melee: ['unarmed', 'blade', 'bludgeon', 'natural'],
      Navigation: [],
      Persuade: [],
      Pilot: ['small craft', 'spacecraft', 'capital ships'],
      Profession: ['belter', 'biologicals', 'civil engineering', 'construction', 'hydroponics', 'polymers'],
      Recon: [],
      Science: [
        'archaeology', 'astronomy', 'biology', 'chemistry', 'cosmology', 'cybernetics', 'economics', 'genetics',
        'history', 'linguistics', 'philosophy', 'physics', 'planetology', 'psionicology', 'psychology', 'robotics',
        'sophontology', 'xenology',
      ],
      Seafarer: ['ocean ships', 'personal', 'sail', 'submarine'],
      Stealth: [],
      Steward: [],
      Streetwise: [],
      Survival: [],
      Tactics: ['military', 'naval'],
      'Vacc Suit': [],
    },

    backgrounds: [
      {
        id: 'belter', name: 'Belter',
        mods: 'STR -1, DEX +1, EDU -1',
        skills: ['Astrogation 0', 'Carouse 0', 'Electronics 0', 'Jack-of-All-Trades 1', 'Mechanic 0', 'Medic 0', 'Profession (belter) 2', 'Recon 0', 'Science 0', 'Vacc Suit 1'],
        benefits: ['Cr 2500', 'Vacc Suit'],
      },
      {
        id: 'colonist', name: 'Colonist',
        mods: 'END +1, EDU -1',
        skills: ['Athletics (strength) 1', 'Drive 0', 'Gun Combat (slug) 1', 'Jack-of-All-Trades 1', 'Mechanic 0', 'Medic 0', 'Navigation 0', 'Profession 0', 'Recon 0', 'Survival 2'],
        benefits: ['Cr 5000', 'Rifle / Carbine'],
      },
      {
        id: 'developed-world', name: 'Developed World',
        mods: 'EDU +1',
        skills: ['Admin 1', 'Advocate 0', 'Art 0', 'Diplomat 0', 'Drive (wheel) 1', 'Electronics (comms/computers) 1', 'Flyer 0', 'Profession (any) 1', 'Science (any) 1', 'Streetwise 0'],
        benefits: ['Cr 10000', 'Portable Computer'],
      },
      {
        id: 'fringe', name: 'Fringe',
        mods: 'DEX +1, EDU -2, SOC -2',
        skills: ['Athletics (dexterity) 1', 'Deception 1', 'Gambler 0', 'Gun Combat 0', 'Melee (unarmed) 1', 'Recon 0', 'Stealth 0'],
        benefits: ['Cr 1000', 'Blade'],
      },
      {
        // Le livre dit « Profession (any suitable) » : liste de métiers adaptés proposée par l'outil.
        id: 'low-tech', name: 'Low-Tech',
        mods: 'END +2, EDU -3',
        skills: ['Animals (any) 1', 'Athletics 0', 'Carouse 0', 'Gun Combat (archaic) 1', 'Language (local dialect) 2', 'Melee (any) 1', 'Navigation 0', 'Profession (farmer/herder/hunter/fisher/craftsman) 2', 'Recon 0', 'Steward 0', 'Streetwise 0', 'Survival 1'],
        benefits: ['Cr 5000', 'Blade / Club / Dagger'],
      },
      {
        id: 'metropolis', name: 'Metropolis',
        mods: 'STR -1, END -1, EDU +2',
        skills: ['Admin 1', 'Advocate 0', 'Broker 0', 'Carouse 0', 'Diplomat 1', 'Drive 0', 'Electronics (comms/computers) 1', 'Profession (any) 2', 'Streetwise 1'],
        benefits: ['Cr 10000', 'Portable Computer'],
      },
      {
        id: 'space-habitat', name: 'Space Habitat',
        mods: 'DEX +1, END -1, EDU +1',
        skills: ['Admin 0', 'Astrogation 0', 'Athletics (dexterity) 1', 'Electronics (any) 1', 'Engineer (life support) 1', 'Mechanic 0', 'Profession (any) 1', 'Science 0', 'Steward 0', 'Vacc Suit 0'],
        benefits: ['Cr 5000', 'Vacc Suit'],
      },
      {
        id: 'water-world', name: 'Water World',
        mods: 'END +1',
        skills: ['Admin 0', 'Athletics 0', 'Carouse 0', 'Electronics 0', 'Navigation 1', 'Profession (any) 1', 'Recon 1', 'Seafarer (any) 2', 'Survival 0'],
        benefits: ['Cr 5000'],
      },
    ],

    careers: [
      {
        id: 'administrator', name: 'Administrator', mods: 'EDU +1, SOC +1', priority: 'EDU, SOC, INT',
        skills: ['Admin 3', 'Advocate 1', 'Art 0', 'Broker 1', 'Carouse 1', 'Diplomat 1', 'Drive 0', 'Electronics (computers) 1', 'Leadership 0', 'Profession 0', 'Science 0'],
        benefits: ['Rank 4 (senior manager)', 'Cr 75000', '3 Contacts (former colleagues)'],
        roles: ['Gestionnaire d’astroport', 'Cadre d’une ligne de fret', 'Haut fonctionnaire planétaire', 'Responsable de filiale'],
      },
      {
        id: 'agent', name: 'Agent', mods: 'INT +1', priority: 'INT, DEX, EDU',
        skills: ['Advocate 0', 'Carouse 1', 'Deception 1', 'Drive 0', 'Electronics (comms) 1', 'Gun Combat 0', 'Investigate 2', 'Melee 0', 'Persuade 1', 'Recon 1', 'Stealth 1', 'Streetwise 2'],
        benefits: ['Rank 2 (field agent)', 'Cr 35000', 'Pistol', '3 Contacts (former informants or colleagues)'],
        roles: ['Détective de police', 'Membre du renseignement', 'Spécialiste de sécurité corporative', 'Fonctionnaire des douanes'],
      },
      {
        // « Athletics (any) 0 » dans le livre : au niveau 0, pas de spécialité.
        // « Profession (any suitable) » : liste de métiers adaptés proposée par l'outil.
        id: 'barbarian', name: 'Barbarian', mods: 'STR +1, END +2', priority: 'STR, END, DEX',
        skills: ['Animals (any) 1', 'Athletics 0', 'Carouse 0', 'Melee (blade) 2', 'Navigation 0', 'Profession (farmer/herder/hunter/fisher/craftsman) 1', 'Recon 1', 'Seafarer 0', 'Stealth 0', 'Survival 2'],
        benefits: ['Rank 2 (warrior)', 'Cr 1000', 'Blade / Staff'],
        roles: ['Membre d’un clan guerrier', 'Guide nomade', 'Garde d’un chef de guerre', 'Guide de chasse'],
      },
      {
        id: 'citizen', name: 'Citizen', mods: 'EDU +1', priority: 'EDU, INT, SOC',
        skills: ['Admin 1', 'Advocate 0', 'Art 0', 'Carouse 0', 'Deception 0', 'Diplomat 0', 'Drive (any) 1', 'Electronics (computers) 1', 'Flyer (any) 1', 'Mechanic 0', 'Medic 0', 'Persuade 0', 'Profession (any) 2', 'Science (any) 1', 'Streetwise 1'],
        benefits: ['Cr 30000', '2 Contacts (former friends or business associates)'],
        roles: ['Comptable', 'Cadre moyen', 'Spécialiste en bureau d’études', 'Propriétaire d’une petite boutique'],
      },
      {
        id: 'corsair', name: 'Corsair', mods: 'DEX +1, SOC -2', priority: 'DEX, END, STR',
        skills: ['Athletics (dexterity) 1', 'Deception 0', 'Electronics (any) 1', 'Engineer 0', 'Explosives 0', 'Gun Combat (any) 1', 'Gunner 1', 'Mechanic 1', 'Medic 0', 'Melee (any) 1', 'Recon 0', 'Streetwise 0', 'Vacc Suit 2'],
        benefits: ['Rank 2 (corporal)', 'Cr 15000', 'Submachinegun (or similar close combat weapon)', '2 Contacts (former crewmembers)'],
        roles: ['Pirate', 'Corsaire sous lettre de marque', 'Membre d’un équipage de contrebande', 'Spécialiste de l’abordage'],
      },
      {
        id: 'marine', name: 'Marine', mods: 'DEX +1, EDU +1', priority: 'DEX, END, STR',
        skills: ['Athletics 0', 'Electronics 0', 'Explosives 0', 'Gun Combat (any) 2', 'Gunner 1', 'Heavy Weapons 0', 'Medic 0', 'Melee (blade) 1', 'Recon 0', 'Vacc Suit 2'],
        benefits: ['Rank 2 (corporal)', 'Cr 35000', 'Assault Rifle', '2 Contacts (former unit members or crew)'],
        roles: ['Membre des troupes embarquées', 'Mercenaire de l’espace', 'Garde de vaisseau', 'Spécialiste du combat en scaphandre'],
      },
      {
        id: 'medic', name: 'Medic', mods: 'SOC +1', priority: 'EDU, INT, DEX',
        skills: ['Admin 2', 'Advocate 0', 'Diplomat 0', 'Drive 0', 'Electronics (computers) 1', 'Flyer 0', 'Investigate 1', 'Medic 3', 'Persuade 1', 'Science (any) 1'],
        benefits: ['Cr 90000', 'Medikit', '2 Contacts (in the medical field or patients)'],
        roles: ['Médecin de bord', 'Spécialiste en chirurgie', 'Urgentiste', 'Médecin de campagne'],
      },
      {
        id: 'military-enlisted', name: 'Military (Enlisted)', mods: 'END +2', priority: 'END, STR, DEX',
        skills: ['Athletics (endurance) 1', 'Drive 0', 'Electronics 0', 'Explosives 1', 'Gun Combat (any) 3', 'Heavy Weapons 1', 'Mechanic 1', 'Medic 0', 'Melee 0', 'Recon 1', 'Stealth 0'],
        benefits: ['Rank 2 (corporal)', 'Cr 25000', 'Assault Rifle', '1 Ally (former unit buddy)'],
        roles: ['Membre de l’infanterie', 'Mercenaire', 'Volontaire de milice coloniale', 'Spécialiste des armes lourdes'],
      },
      {
        id: 'military-officer', name: 'Military (Officer)', mods: 'EDU +1', priority: 'INT, EDU, END',
        skills: ['Admin 1', 'Athletics (endurance) 1', 'Diplomat 1', 'Drive 0', 'Electronics 0', 'Gun Combat (any) 1', 'Leadership 2', 'Medic 0', 'Recon 1', 'Stealth 0', 'Tactics (military) 1'],
        benefits: ['Rank 2 (captain)', 'Cr 60000', 'Gauss Pistol', '1 Contact (former colleague or subordinate)'],
        roles: ['Capitaine d’infanterie', 'Capitaine de milice', 'Chef de compagnie mercenaire', 'Membre d’un état-major'],
      },
      {
        id: 'noble', name: 'Noble', mods: 'EDU +1', priority: 'SOC, EDU, INT', requires: 'SOC 10+',
        skills: ['Admin 1', 'Advocate 1', 'Art 0', 'Broker 0', 'Carouse 1', 'Deception 0', 'Diplomat 2', 'Gambler 0', 'Leadership 2', 'Persuade 1'],
        benefits: ['Minor noble title: Knight / Minor noble title: Dame / Minor noble title: Ritter', 'Cr 100000', '3 Contacts (nobles, administrators or military)'],
        roles: ['Noble en mission', 'Émissaire d’une grande maison', 'Titulaire d’un petit fief', 'Membre d’une cour planétaire'],
      },
      {
        id: 'performer', name: 'Performer', mods: 'INT +1', priority: 'INT, DEX, SOC',
        skills: ['Art (any) 3', 'Athletics 0', 'Broker 0', 'Carouse 2', 'Deception 1', 'Gambler 0', 'Persuade 1', 'Profession 0', 'Steward 1', 'Streetwise 1'],
        benefits: ['Cr 10000', '3 Contacts'],
        roles: ['Artiste de rue', 'Interprète de vidéodrame', 'Membre d’une troupe itinérante', 'Pianiste de concert'],
      },
      {
        id: 'rogue', name: 'Rogue', mods: 'INT +1, SOC -1', priority: 'DEX, INT, END',
        skills: ['Athletics 0', 'Deception 1', 'Electronics 0', 'Gambler 1', 'Gun Combat 0', 'Melee (any) 1', 'Persuade 0', 'Recon 1', 'Stealth 2', 'Streetwise 2'],
        benefits: ['Cr 10000', '2 Contacts (underworld connections)'],
        roles: ['Escroc', 'Spécialiste du cambriolage', 'Intermédiaire de la pègre', 'Membre d’un gang'],
      },
      {
        id: 'scholar', name: 'Scholar', mods: 'INT +1, EDU +1', priority: 'EDU, INT, SOC',
        skills: ['Art 0', 'Diplomat 0', 'Drive 0', 'Electronics (computers) 1', 'Investigate 2', 'Medic 0', 'Navigation 0', 'Science (any) 3', 'Science (any) 1', 'Persuade 1', 'Profession 0'],
        benefits: ['Cr 50000', '3 Contacts (academics or publishing professionals)'],
        roles: ['Scientifique de terrain', 'Universitaire', 'Archiviste', 'Spécialiste théorique'],
      },
      {
        // « Pilot (starship) » dans le livre : spécialité « spacecraft » du livre de base.
        id: 'scout', name: 'Scout', mods: 'INT +1', priority: 'INT, DEX, EDU',
        skills: ['Astrogation 1', 'Carouse 0', 'Drive 0', 'Electronics (computers) 1', 'Engineer (any) 1', 'Gun Combat 0', 'Investigate 0', 'Jack-of-All-Trades 1', 'Medic 0', 'Pilot (spacecraft) 1', 'Recon 0', 'Streetwise 0', 'Vacc Suit 1'],
        benefits: ['Cr 25000', '3 Contacts (spacers or contacts on distant worlds)'],
        roles: ['Pilote de courrier', 'Cartographe stellaire', 'Membre d’un équipage de relevés', 'Guide d’exploration'],
      },
      {
        id: 'spacer-crew', name: 'Spacer (Crew)', mods: 'DEX +1', priority: 'DEX, INT, END',
        skills: ['Athletics (any) 1', 'Electronics (any) 1', 'Engineer (any) 1', 'Gunner 0', 'Mechanic 1', 'Medic 0', 'Persuade 0', 'Pilot 0', 'Steward 1', 'Vacc Suit 3'],
        benefits: ['Cr 35000', '2 Contacts (crewmates or portside staff)'],
        roles: ['Mécano de bord', 'Membre d’équipage', 'Spécialiste des machines', 'Responsable de l’intendance'],
      },
      {
        id: 'spacer-command', name: 'Spacer (Command)', mods: 'INT +1', priority: 'INT, DEX, EDU',
        skills: ['Admin 1', 'Advocate 0', 'Astrogation 1', 'Broker 0', 'Electronics (sensors) 1', 'Gunner 1', 'Leadership 0', 'Persuade 0', 'Pilot (spacecraft) 2', 'Tactics 0', 'Vacc Suit 1'],
        benefits: ['Rank 2 (lieutenant or 4th officer)', 'Cr 75000', '1 Ally (former colleague or government official)'],
        roles: ['Pilote de ligne', 'Pilote de cargo', 'Responsable de la navigation', 'Chef de quart'],
      },
      {
        id: 'wanderer', name: 'Wanderer', mods: '', priority: 'END, DEX, INT',
        skills: ['Carouse 0', 'Deception 0', 'Drive 0', 'Gun Combat 0', 'Mechanic 0', 'Melee (unarmed) 1', 'Profession 0', 'Recon 1', 'Stealth 1', 'Steward 1', 'Streetwise 2', 'Survival 0', 'Vacc Suit 1'],
        benefits: ['Cr 2500', '3 Contacts', '1 Ally'],
        roles: ['Sans-attache des astroports', 'Main-d’œuvre de passage', 'Membre d’équipage occasionnel', 'Pique-assiette interstellaire'],
      },
    ],

    // « Finalising the Traveller » : un choix dans chacune des trois catégories.
    // Le choix de carrière (une compétence au niveau 4, trois compétences +1 ou rang 4) est géré par le moteur.
    finalisation: {
      skillPairs: [
        'Vacc Suit 1, Steward 1',
        'Gunner (any) 1, Mechanic 1',
        'Pilot (any) 1, Electronics (any) 1',
        'Gun Combat (any) 1, Recon 1',
        'Melee (any) 1, Streetwise 1',
        'Broker 1, Admin 1',
        'Carouse 1, Deception 1',
        'Engineer (any) 1, Electronics (any) 1',
        'Science (any) 1, Investigate 1',
        'Drive (any) 1, Profession (any) 1',
        'Survival 1, Navigation 1',
        'Medic 1, Admin 1',
      ],
      benefits: ['1 Ship Share', 'Cr 100000', 'Combat implant', '1 Ally and 2 Contacts', 'TAS Membership', 'SOC +1'],
    },

    // Habillage hors règles : noms et portrait.
    flavor: {
      firstNames: [
        'Mara', 'Jonas', 'Aiko', 'Dev', 'Sélène', 'Tariq', 'Ilse', 'Kwame', 'Naya', 'Oren', 'Yuki', 'Bastien', 'Zofia', 'Emeka',
        'Livia', 'Hakon', 'Amara', 'Rafael', 'Shira', 'Tomasz', 'Enli', 'Gishar', 'Khami', 'Sharik', 'Ludmila', 'Idris',
        'Corinne', 'Anselm', 'Priya', 'Matéo', 'Sunniva', 'Darius', 'Noor', 'Viktor', 'Leilani', 'Cassian', 'Odile', 'Jarek',
        'Maïa', 'Temur', 'Rhea', 'Lucan', 'Inès', 'Kofi', 'Astrid', 'Ravi',
      ],
      lastNames: [
        'Okonkwo', 'Varga', 'Tanaka', 'Delacroix', 'Shudusham', 'Lindqvist', 'Marchetti', 'Khirgan', 'Abara', 'Novak',
        'Hartmann', 'Ishkur', 'Castellan', 'Rao', 'Dupré', 'Kowalczyk', 'Amadi', 'Sorensen', 'Lugalki', 'Moreau', 'Vasquez',
        'Thorne', 'Nakamura', 'Bergström', 'El-Amin', 'Gashidda', 'Petrov', 'Hale', 'Oyelaran', 'Ferreira', 'Ziruun', 'Kessler',
        'Baptiste', 'Demir', 'Halloran', 'Mbeki', 'Aldani', 'Rousseau', 'Tvedt', 'Sharrukin',
      ],
      personalities: [
        'calme et méthodique, ne hausse jamais le ton', 'toujours une anecdote en réserve', 'se méfie de toute autorité',
        'd’une politesse glaciale', 'bonne humeur de façade, calcule tout', 'consulte les présages avant chaque saut',
        'idéaliste, malgré plusieurs déceptions', 'pragmatique jusqu’au cynisme', 'd’une loyauté excessive envers ses anciens camarades',
        'pose trop de questions sur tout', 'colérique, mais sans rancune', 's’exprime mieux par écrit qu’à l’oral',
        'susceptible dès qu’on parle de ses origines', 'parie sur tout et n’importe quoi', 'prend la défense des plus faibles',
        'perfectionniste, refait le travail des autres', 'fataliste, hausse les épaules face au danger', 'promet plus que ce qui sera tenu',
        'répond par monosyllabes', 'incapable de garder ses crédits', 'vérifie chaque sas deux fois',
        'se voit déjà ailleurs, plus haut', 'nostalgique d’un monde quitté trop tôt', 'pince-sans-rire',
      ],
      quirks: [
        'cicatrice de brûlure sur l’avant-bras gauche', 'prothèse oculaire de vieille facture', 'tatouage d’unité à moitié effacé',
        'accent prononcé d’un monde frontalier', 'toujours un stylet derrière l’oreille', 'boite légèrement de la jambe droite',
        'manteau trop grand, plein de poches', 'cheveux teints d’une couleur vive', 'mâche sans arrêt une racine stimulante',
        'chevalière qui tourne au doigt pendant la conversation', 'voix rauque, séquelle d’une dépressurisation', 'mains tachées de lubrifiant',
        'ne croise jamais le regard de son interlocuteur', 'collectionne les jetons de casinos d’astroport', 'siffle des airs militaires',
        'lunettes teintées même à l’intérieur', 'tenue civile impeccablement repassée', 'pendentif religieux usé',
        'rit trop fort', 'tient un carnet en papier, anachronique', 'démarche de quelqu’un qui a grandi en basse gravité',
        'parle à son ordinateur comme à un animal', 'crâne rasé, implant visible à la tempe', 'odeur persistante d’ozone et de café',
      ],
      goals: [
        'rembourser une dette avant la fin de l’année', 'retrouver un frère disparu sur un monde rouge', 'quitter ce système par n’importe quel moyen',
        'obtenir un poste à bord d’un vaisseau', 'se venger d’un ancien supérieur', 'faire oublier son passé',
        'réunir de quoi acheter une part de vaisseau', 'protéger sa famille restée au pays', 'prouver sa valeur à un mentor',
        'vendre une information qui lui brûle les doigts', 'publier une découverte que personne ne croit', 'échapper à un contrat regretté',
        'monter sa propre affaire', 'gagner un titre ou une reconnaissance officielle', 'retrouver un objet volé',
        'recruter une équipe fiable pour un travail risqué', 'payer un traitement médical coûteux', 'voir la capitale au moins une fois',
        'solder une vieille rivalité', 'trouver un endroit calme où s’installer', 'faire tomber un fonctionnaire corrompu',
        'livrer une cargaison sans poser de questions', 'apprendre ce qui est arrivé à son ancien équipage', 'simplement finir la journée',
      ],
    },
  };

  root.TRAVELLER_DATA = data;
  if (typeof module === 'object' && module.exports) module.exports = data;
})(typeof globalThis !== 'undefined' ? globalThis : this);
