// Generates public/names.json from curated per-culture lists.
// Each culture has boy / girl / unisex arrays. Entries are ["Name","meaning"].
// Run: npm run gen:names   (node scripts/generate_names.mjs)
//
// Meanings are concise, well-established etymologies. To grow further, append
// more entries here, or import a public CSV into Supabase (see README).

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PRON, ALTS } from "./pron_data.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const CULTURES = {
  english:   { label: "English",            region: "Western Europe" },
  irish:     { label: "Irish & Celtic",     region: "Western Europe" },
  scottish:  { label: "Scottish",           region: "Western Europe" },
  french:    { label: "French",             region: "Western Europe" },
  italian:   { label: "Italian",            region: "Southern Europe" },
  spanish:   { label: "Spanish & Latin",    region: "Southern Europe" },
  german:    { label: "German",             region: "Central Europe" },
  nordic:    { label: "Scandinavian",       region: "Northern Europe" },
  slavic:    { label: "Slavic",             region: "Eastern Europe" },
  greek:     { label: "Greek",              region: "Southern Europe" },
  armenian:  { label: "Armenian",           region: "Caucasus" },
  hebrew:    { label: "Hebrew",             region: "Middle East" },
  arabic:    { label: "Arabic",             region: "Middle East" },
  persian:   { label: "Persian",            region: "Middle East" },
  turkish:   { label: "Turkish",            region: "Middle East" },
  indian:    { label: "Indian & Sanskrit",  region: "South Asia" },
  japanese:  { label: "Japanese",           region: "East Asia" },
  chinese:   { label: "Chinese",            region: "East Asia" },
  korean:    { label: "Korean",             region: "East Asia" },
  african:   { label: "African",            region: "Africa" },
  hawaiian:  { label: "Hawaiian",           region: "Pacific" },
  american:  { label: "American (modern)",  region: "Americas" },
  russian:   { label: "Russian",            region: "Eastern Europe" },
  polish:    { label: "Polish",             region: "Eastern Europe" },
  portuguese:{ label: "Portuguese & Brazilian", region: "Southern Europe" },
  vietnamese:{ label: "Vietnamese",         region: "Southeast Asia" },
  filipino:  { label: "Filipino",           region: "Southeast Asia" },
};

const DATA = {
  english: {
    boy: [
      ["Oliver","olive tree, peace"],["Henry","home ruler"],["Theodore","gift of God"],["Jack","God is gracious"],
      ["William","resolute protector"],["George","farmer"],["Arthur","bear, strength"],["Edward","wealthy guardian"],
      ["Charles","free man"],["Frederick","peaceful ruler"],["Alfred","wise counsel"],["Walter","army ruler"],
      ["Miles","soldier, merciful"],["Graham","gravel homestead"],["Dexter","dyer, skilled"],["Hugh","mind, spirit"],
      ["Cole","swarthy, coal-dark"],["Reid","red-haired"],["Oscar","deer-lover, divine spear"],["Felix","lucky, fortunate"],
      ["Everett","brave as a boar"],["Wesley","western meadow"],["Bennett","blessed"],["Harold","army ruler"],
      ["Nathaniel","gift of God"],["Sebastian","venerable, revered"],["Maxwell","great stream"],["Chester","fortress, camp"],
      ["Silas","of the forest"],["Rupert","bright fame"],["Percy","pierces the valley"],["Warren","park keeper"],
      ["Clifford","ford by a cliff"],["Byron","at the cattle sheds"],["Leonard","brave lion"],["Ronald","ruler's counsel"],
    ],
    girl: [
      ["Charlotte","free woman"],["Amelia","industrious"],["Evelyn","wished-for child"],["Grace","grace of God"],
      ["Alice","noble"],["Florence","flourishing"],["Beatrice","she who brings joy"],["Harriet","home ruler"],
      ["Ivy","faithfulness, the vine"],["Margaret","pearl"],["Eleanor","bright, shining"],["Rose","the flower"],
      ["Hazel","the hazel tree"],["Winifred","blessed peace"],["Maisie","pearl"],["Nora","honor, light"],
      ["Pearl","precious gem"],["Faye","fairy, faith"],["Emily","rival, eager"],["Josephine","God will add"],
      ["Violet","the purple flower"],["Audrey","noble strength"],["Poppy","the red flower"],["Cora","maiden"],
      ["Edith","prosperous in war"],["Matilda","mighty in battle"],["Penelope","weaver"],["Clara","bright, clear"],
      ["Sylvia","of the forest"],["Iris","rainbow"],["Millicent","strong in work"],["Lucy","light"],
      ["Georgia","farmer"],["Vivienne","alive, lively"],["Maren","of the sea"],["Wren","the small bird"],
    ],
    unisex: [
      ["Riley","valiant, courageous"],["Blake","dark or fair"],["Quinn","wise, counsel"],["Rowan","little red one"],
      ["Sage","wise, the herb"],["Alex","defender of people"],["Emerson","son of Emery"],["Harper","harp player"],
      ["Ellis","benevolent"],["Aubrey","elf ruler"],["Marley","pleasant meadow"],["Reese","ardent, fiery"],
    ],
  },
  irish: {
    boy: [
      ["Liam","strong-willed protector"],["Aiden","little fire"],["Cian","ancient, enduring"],["Declan","full of goodness"],
      ["Finn","fair, white"],["Cormac","charioteer"],["Oisin","little deer"],["Ronan","little seal"],
      ["Seamus","supplanter"],["Eoin","God is gracious"],["Padraig","noble, patrician"],["Cillian","little church, strife"],
      ["Fergus","man of vigor"],["Niall","champion, cloud"],["Conor","lover of hounds"],["Rory","red king"],
      ["Tadhg","poet, philosopher"],["Brennan","little raven, sorrow"],["Callahan","bright-headed"],["Desmond","from south Munster"],
      ["Eamon","wealthy protector"],["Lorcan","little fierce one"],["Odhran","little pale green one"],["Senan","little wise one"],
    ],
    girl: [
      ["Saoirse","freedom, liberty"],["Aoife","radiant, beautiful"],["Niamh","bright, radiant"],["Ciara","dark-haired"],
      ["Siobhan","God is gracious"],["Maeve","she who intoxicates"],["Roisin","little rose"],["Orla","golden princess"],
      ["Fiona","fair, white"],["Sinead","God is gracious"],["Bridget","exalted, strength"],["Nuala","fair shoulder"],
      ["Grainne","grain, love"],["Deirdre","sorrowful, broken-hearted"],["Aisling","dream, vision"],["Caoimhe","gentle, beautiful"],
      ["Eilis","God is my oath"],["Muireann","sea-white, fair"],["Sorcha","brightness, radiance"],["Cara","friend, beloved"],
      ["Aine","radiance, splendor"],["Blathnaid","little flower"],["Clodagh","named for a river"],["Etain","jealousy, shining"],
    ],
    unisex: [
      ["Rowan","little red one"],["Kelly","bright-headed, warrior"],["Casey","vigilant, watchful"],["Shea","stately, fortunate"],
      ["Devin","poet, fawn"],["Flannery","red valor"],["Rian","little king"],["Sloane","raider"],
    ],
  },
  scottish: {
    boy: [
      ["Callum","dove"],["Angus","one strength, one choice"],["Hamish","supplanter"],["Fraser","of the forest men"],
      ["Lachlan","from the land of lakes"],["Ewan","born of the yew"],["Malcolm","devotee of St. Columba"],["Alistair","defender of the people"],
      ["Duncan","dark warrior"],["Ruaridh","red king"],["Blair","field, plain"],["Gordon","great hill"],
      ["Kenneth","handsome, born of fire"],["Struan","stream, rivulet"],["Douglas","dark water"],["Iain","God is gracious"],
      ["Craig","from the crag"],["Finlay","fair warrior"],["Murray","settlement by the sea"],["Bruce","the thicket"],
      ["Gregor","watchful, vigilant"],["Kade","from the wetlands"],["Ross","headland, cape"],["Wallace","foreigner, Welshman"],
    ],
    girl: [
      ["Isla","the island"],["Skye","from the Isle of Skye"],["Elsie","pledged to God"],["Ainsley","one's own meadow"],
      ["Iona","named for the isle"],["Mhairi","beloved, bitter"],["Catriona","pure"],["Kirsty","follower of Christ"],
      ["Rhona","rough island"],["Effie","pleasant speech"],["Senga","slender, fair"],["Morag","great, sun"],
      ["Bonnie","pretty, cheerful"],["Greer","watchful, vigilant"],["Lorna","little fox, laurel"],["Fenella","white shoulder"],
      ["Davina","beloved"],["Elspeth","pledged to God"],["Maisie","pearl"],["Paisley","church, cemetery"],
      ["Ishbel","pledged to God"],["Jean","God is gracious"],["Nairn","alder tree river"],["Sheena","God is gracious"],
    ],
    unisex: [
      ["Blair","field, plain"],["Lennox","by the elm grove"],["Mackenzie","child of the wise ruler"],["Kade","from the wetlands"],
      ["Ross","headland"],["Islay","named for the isle"],
    ],
  },
  french: {
    boy: [
      ["Louis","famous warrior"],["Julien","youthful"],["Gabriel","God is my strength"],["Antoine","priceless, praiseworthy"],
      ["Lucas","bringer of light"],["Mathis","gift of God"],["Raphael","God has healed"],["Etienne","crown, garland"],
      ["Olivier","olive tree"],["Sacha","defender of mankind"],["Remy","oarsman, from Rheims"],["Pascal","of Easter"],
      ["Florian","flowering, blossoming"],["Cedric","bounty, kindly"],["Bastien","venerable"],["Thibault","brave people"],
      ["Amaury","work-power"],["Corentin","hurricane, storm"],["Gaspard","treasure keeper"],["Loic","glory in battle"],
      ["Maxime","greatest"],["Aurelien","golden"],["Baptiste","baptist"],["Sylvain","of the forest"],
    ],
    girl: [
      ["Camille","young ceremonial attendant"],["Chloe","green shoot, blooming"],["Manon","bitter, beloved"],["Elise","pledged to God"],
      ["Amelie","industrious, striving"],["Margaux","pearl"],["Colette","victory of the people"],["Sylvie","of the forest"],
      ["Genevieve","tribe woman"],["Aurelie","golden"],["Delphine","dolphin, of Delphi"],["Josephine","God will add"],
      ["Celeste","heavenly"],["Fleur","flower"],["Odette","wealth, fortune"],["Solene","solemn, dignified"],
      ["Vivienne","alive, lively"],["Noemie","pleasantness"],["Ines","pure, holy"],["Lea","weary, meadow"],
      ["Adele","noble, kind"],["Sabine","of the Sabine people"],["Emmanuelle","God is with us"],["Perrine","rock, stone"],
    ],
    unisex: [
      ["Claude","lame, enclosure"],["Camille","attendant, pure"],["Dominique","of the Lord"],["Rene","reborn"],
      ["Sacha","defender"],["Maxime","greatest"],
    ],
  },
  italian: {
    boy: [
      ["Leonardo","brave as a lion"],["Matteo","gift of God"],["Alessandro","defender of mankind"],["Lorenzo","from Laurentum, laurel"],
      ["Giovanni","God is gracious"],["Marco","warlike, of Mars"],["Antonio","priceless, praiseworthy"],["Francesco","free man"],
      ["Luca","bringer of light"],["Dante","enduring, steadfast"],["Emilio","rival, eager"],["Fabrizio","craftsman"],
      ["Giuseppe","God will add"],["Salvatore","savior"],["Vincenzo","conquering"],["Enzo","ruler of the home"],
      ["Cristiano","follower of Christ"],["Massimo","greatest"],["Nico","victory of the people"],["Raffaele","God has healed"],
      ["Stefano","crown, garland"],["Valentino","strong, healthy"],["Bruno","brown, armor"],["Gian","God is gracious"],
    ],
    girl: [
      ["Sofia","wisdom"],["Giulia","youthful"],["Aurora","dawn"],["Chiara","bright, clear"],
      ["Francesca","free woman"],["Valentina","strong, healthy"],["Bianca","white, pure"],["Alessia","defender"],
      ["Martina","of Mars, warlike"],["Beatrice","she who brings joy"],["Serena","serene, calm"],["Gaia","earth, joy"],
      ["Elena","bright, shining light"],["Isabella","pledged to God"],["Camilla","ceremonial attendant"],["Lucia","light"],
      ["Federica","peaceful ruler"],["Ginevra","white shadow, fair"],["Noemi","pleasantness"],["Alba","dawn, sunrise"],
      ["Vittoria","victory"],["Rosa","the rose"],["Cecilia","blind, patroness of music"],["Emma","whole, universal"],
    ],
    unisex: [
      ["Andrea","manly, brave"],["Celeste","heavenly"],["Nicola","victory of the people"],["Gioia","joy"],
    ],
  },
  spanish: {
    boy: [
      ["Mateo","gift of God"],["Diego","supplanter"],["Santiago","Saint James"],["Alejandro","defender of mankind"],
      ["Javier","new house, bright"],["Mateo","gift of God"],["Rafael","God has healed"],["Emiliano","rival, eager"],
      ["Pablo","small, humble"],["Sergio","servant, attendant"],["Andres","manly, brave"],["Ignacio","fiery, ardent"],
      ["Rodrigo","famous ruler"],["Marcos","warlike"],["Alonso","noble and ready"],["Cruz","cross"],
      ["Joaquin","raised by God"],["Ramon","wise protector"],["Salvador","savior"],["Nicolas","victory of the people"],
      ["Esteban","crown, garland"],["Gael","generous lord"],["Bruno","brown"],["Tomas","twin"],
    ],
    girl: [
      ["Sofia","wisdom"],["Valentina","strong, healthy"],["Isabela","pledged to God"],["Camila","attendant"],
      ["Lucia","light"],["Valeria","strong, vigorous"],["Ximena","hearkening, listener"],["Paloma","dove"],
      ["Carmen","garden, song"],["Rocio","dew, morning mist"],["Pilar","pillar of strength"],["Dolores","sorrows"],
      ["Esperanza","hope"],["Mercedes","mercies"],["Guadalupe","valley of the wolf"],["Renata","reborn"],
      ["Alejandra","defender"],["Marisol","sea and sun"],["Consuelo","consolation, comfort"],["Aitana","named for a mountain"],
      ["Julieta","youthful"],["Bianca","white"],["Amaya","end, night rain"],["Regina","queen"],
    ],
    unisex: [
      ["Guadalupe","valley of the wolf"],["Cruz","cross"],["Reyes","kings"],["Trinidad","trinity"],
    ],
  },
  german: {
    boy: [
      ["Felix","lucky, fortunate"],["Maximilian","greatest"],["Lukas","bringer of light"],["Jonas","dove"],
      ["Emil","rival, eager"],["Anton","priceless"],["Fritz","peaceful ruler"],["Klaus","victory of the people"],
      ["Otto","wealth, fortune"],["Konrad","brave counsel"],["Dietrich","ruler of the people"],["Ansel","follower of a nobleman"],
      ["Gerhard","brave with a spear"],["Wolfgang","wolf's path"],["Kurt","brave counsel"],["Heinrich","home ruler"],
      ["Lennard","brave lion"],["Bastian","venerable"],["Falko","falcon"],["Rainer","wise army"],
      ["Stefan","crown, garland"],["Ludwig","famous warrior"],["Norbert","bright north"],["Reinhard","strong counsel"],
    ],
    girl: [
      ["Mia","mine, beloved"],["Emilia","rival, industrious"],["Hanna","grace, favor"],["Frieda","peace"],
      ["Greta","pearl"],["Ingrid","beautiful, beloved"],["Heidi","noble one"],["Lorelei","alluring rock, murmuring"],
      ["Klara","bright, clear"],["Elke","noble"],["Annelise","grace and God's oath"],["Gisela","pledge, hostage"],
      ["Katharina","pure"],["Liesel","pledged to God"],["Sieglinde","victory and soft"],["Anneke","grace"],
      ["Johanna","God is gracious"],["Marlene","of Magdala, bitter"],["Ada","noble, nobility"],["Elfriede","elf strength"],
      ["Petra","rock, stone"],["Sabine","Sabine woman"],["Trudi","spear of strength"],["Wilhelmina","resolute protector"],
    ],
    unisex: [
      ["Toni","priceless"],["Kai","keeper of the keys"],["Mika","who is like God"],["Nikita","unconquered"],
    ],
  },
  nordic: {
    boy: [
      ["Magnus","great, mighty"],["Bjorn","bear"],["Erik","eternal ruler"],["Leif","heir, descendant"],
      ["Odin","fury, inspiration"],["Sven","young man, boy"],["Axel","father of peace"],["Finn","wanderer, Finnish"],
      ["Soren","stern, severe"],["Thor","thunder"],["Anders","manly, brave"],["Gustav","staff of the Goths"],
      ["Nils","victory of the people"],["Viggo","war, battle"],["Halvard","rock defender"],["Torsten","Thor's stone"],
      ["Rune","secret lore"],["Espen","bear of the gods"],["Ivar","bow warrior"],["Sindre","sparkling, from the mine"],
      ["Frode","wise, learned"],["Kjell","cauldron, helmet"],["Ragnar","warrior of judgment"],["Vidar","forest warrior"],
    ],
    girl: [
      ["Freya","noble lady, goddess of love"],["Astrid","divinely beautiful"],["Ingrid","beautiful, beloved"],["Sigrid","victory and beauty"],
      ["Solveig","daughter of the sun, strength"],["Liv","life, protection"],["Signe","new victory"],["Elin","bright, shining"],
      ["Maja","splendid, pearl"],["Thora","thunder goddess"],["Ronja","God is my strength"],["Alva","elf, radiant"],
      ["Saga","seeing one, storyteller"],["Hedda","battle, warfare"],["Tove","beautiful Thor"],["Vera","faith, true"],
      ["Ebba","strength"],["Gudrun","god and secret lore"],["Nanna","daring, brave"],["Siv","bride, kinship"],
      ["Embla","first woman, elm"],["Frida","peace, beloved"],["Marit","pearl"],["Yrsa","she-bear"],
    ],
    unisex: [
      ["Kai","keeper of the keys"],["Ari","eagle"],["Bo","to live, dweller"],["Loke","the trickster god"],
    ],
  },
  slavic: {
    boy: [
      ["Nikolai","victory of the people"],["Ivan","God is gracious"],["Dmitri","devoted to Demeter"],["Alexei","defender"],
      ["Mikhail","who is like God"],["Boris","fighter, wolf"],["Viktor","conqueror"],["Sergei","servant, guardian"],
      ["Anton","priceless"],["Milan","gracious, dear"],["Radek","happy, glad"],["Bogdan","given by God"],
      ["Stanislav","one who achieves glory"],["Vladimir","great ruler, ruler of peace"],["Tomasz","twin"],["Lukasz","bringer of light"],
      ["Kazimir","destroyer of peace, renowned"],["Marek","warlike"],["Andrzej","manly, brave"],["Rostislav","usurping glory"],
      ["Ivo","yew tree"],["Jarek","fierce, spring"],["Pavel","small, humble"],["Zoran","dawn, daybreak"],
    ],
    girl: [
      ["Natasha","born on Christmas, rebirth"],["Anastasia","resurrection"],["Katarina","pure"],["Milena","gracious, dear"],
      ["Nadia","hope"],["Vera","faith"],["Zofia","wisdom"],["Ludmila","dear to the people"],
      ["Irina","peace"],["Svetlana","light, luminous"],["Bojana","battle, warrior"],["Danica","morning star"],
      ["Jasna","clear, bright"],["Lada","goddess of beauty, order"],["Marika","beloved, star of the sea"],["Nina","dreamer, grace"],
      ["Olga","holy, blessed"],["Radmila","happy and dear"],["Tatiana","fairy queen"],["Zlata","golden"],
      ["Dragana","precious, dear"],["Kalina","viburnum flower"],["Mira","peace, admirable"],["Yelena","bright, shining"],
    ],
    unisex: [
      ["Sasha","defender of mankind"],["Mika","who is like God"],["Slavko","glory"],["Vlada","to rule"],
    ],
  },
  greek: {
    boy: [
      ["Alexander","defender of the people"],["Nikolaos","victory of the people"],["Dimitrios","devoted to Demeter"],["Georgios","farmer"],
      ["Ioannis","God is gracious"],["Andreas","manly, brave"],["Konstantinos","constant, steadfast"],["Theodoros","gift of God"],
      ["Stavros","cross"],["Panagiotis","all-holy"],["Christos","anointed one"],["Vasilios","royal, kingly"],
      ["Leonidas","son of the lion"],["Orion","the hunter, of the constellation"],["Apollo","destroyer, god of light"],["Damianos","to tame, subdue"],
      ["Elias","the Lord is my God"],["Yannis","God is gracious"],["Spyridon","spirit, basket"],["Achilles","pain, hero of Troy"],
      ["Marios","of Mars"],["Petros","rock, stone"],["Thanos","noble, immortal"],["Zenon","gift of Zeus"],
    ],
    girl: [
      ["Sophia","wisdom"],["Eleni","bright, shining light"],["Katerina","pure"],["Maria","bitter, beloved"],
      ["Despina","lady, mistress"],["Ioanna","God is gracious"],["Anastasia","resurrection"],["Thalia","to blossom, festivity"],
      ["Athena","goddess of wisdom"],["Calliope","beautiful voice"],["Daphne","laurel tree"],["Chara","joy, gladness"],
      ["Ariadne","most holy"],["Zoe","life"],["Xanthe","golden, fair-haired"],["Melina","honey, dark"],
      ["Iris","rainbow"],["Penelope","weaver"],["Ismene","knowledge"],["Danae","dry, of the myth"],
      ["Selene","moon goddess"],["Phoebe","radiant, bright"],["Theodora","gift of God"],["Nefeli","cloud, mist"],
    ],
    unisex: [
      ["Nikos","victory of the people"],["Elia","the Lord is my God"],["Chryssa","golden"],["Arion","brave, of the poet"],
    ],
  },
  armenian: {
    boy: [
      ["Aram","excellence, royal highness"],["Vahan","shield"],["Hovhannes","God is gracious"],["Tigran","named for the ancient king"],
      ["Armen","Armenian man"],["Narek","named for the poet, monastery"],["Gevorg","farmer"],["Sarkis","protector, shepherd"],
      ["Hayk","legendary founder of Armenia"],["Vartan","he who gives roses"],["Levon","lion"],["Ashot","hope, king's name"],
      ["Davit","beloved"],["Garen","strong, gift"],["Karen","pure, noble"],["Mher","sun, light"],
      ["Raffi","God has healed"],["Sevan","named for the lake"],["Vrej","revenge, resolve"],["Hrant","fiery, ardent"],
      ["Areg","sun"],["Grigor","watchful, vigilant"],["Nubar","new fruit, blossom"],["Shant","lightning"],
    ],
    girl: [
      ["Ani","named for the ancient capital"],["Nairi","land of canyons, ancient Armenia"],["Lucine","moon, light"],["Anahit","goddess of fertility, immaculate"],
      ["Arpine","sunrise, rising sun"],["Mariam","beloved, bitter"],["Sona","beautiful, peacock"],["Nare","woman, fire"],
      ["Gohar","jewel, precious stone"],["Siran","lovely, beautiful"],["Takouhi","queen"],["Zabel","pledged to God"],
      ["Armine","Armenian woman"],["Hasmik","jasmine flower"],["Nvard","tender rose"],["Shushan","lily"],
      ["Vart","rose"],["Lusntag","crown of light"],["Maral","deer, doe"],["Sose","named for the sycamore, heroine"],
      ["Arev","sun"],["Knar","harp, lyre"],["Yeva","life, living one"],["Zvart","cheerful, merry"],
    ],
    unisex: [
      ["Areg","sun"],["Sevan","named for the lake"],["Van","named for the lake and city"],["Arev","sun"],
    ],
  },
  hebrew: {
    boy: [
      ["Noah","rest, comfort"],["Ethan","strong, enduring"],["Asher","happy, blessed"],["Levi","joined, attached"],
      ["Eli","ascended, my God"],["Caleb","devotion, whole-hearted"],["Micah","who is like God"],["Gideon","mighty warrior"],
      ["Aaron","exalted, mountain of strength"],["Nathan","he gave"],["Isaac","he will laugh"],["Jonah","dove"],
      ["Ari","lion"],["Boaz","swiftness, strength"],["Ezra","help, helper"],["Reuben","behold, a son"],
      ["Simon","he has heard"],["Amos","carried by God"],["Malachi","my messenger"],["Tobias","God is good"],
      ["Zev","wolf"],["Nadav","generous, willing"],["Yosef","God will add"],["Eitan","strong, steadfast"],
    ],
    girl: [
      ["Abigail","my father is joy"],["Hannah","grace, favor"],["Naomi","pleasantness"],["Leah","weary, delicate"],
      ["Miriam","beloved, bitter"],["Talia","dew of God"],["Shira","song, poetry"],["Adina","delicate, gentle"],
      ["Eliana","my God has answered"],["Noa","motion, movement"],["Tamar","date palm tree"],["Yael","mountain goat, to ascend"],
      ["Dalia","branch, flowering"],["Ayelet","gazelle, dawn"],["Batya","daughter of God"],["Carmel","garden, orchard"],
      ["Liora","my light"],["Maayan","spring, fountain"],["Rivka","to bind, captivating"],["Shoshana","lily, rose"],
      ["Tova","good, pleasant"],["Yaffa","beautiful"],["Zohar","light, brilliance"],["Netta","plant, seedling"],
    ],
    unisex: [
      ["Ariel","lion of God"],["Noam","pleasantness, delight"],["Shai","gift"],["Yuval","stream, brook"],
    ],
  },
  arabic: {
    boy: [
      ["Omar","flourishing, long-lived"],["Yusuf","God will add, Joseph"],["Zayd","growth, abundance"],["Karim","generous, noble"],
      ["Tariq","morning star, he who knocks"],["Bilal","moisture, first muezzin"],["Amir","prince, commander"],["Rashid","rightly guided"],
      ["Hamza","strong, steadfast lion"],["Idris","interpreter, prophet"],["Malik","king, sovereign"],["Nabil","noble, honorable"],
      ["Samir","companion in evening talk"],["Faris","knight, horseman"],["Jamal","beauty, grace"],["Khalil","friend, companion"],
      ["Sami","elevated, sublime"],["Ziad","growth, abundance"],["Anwar","luminous, radiant"],["Basil","brave, valiant"],
      ["Fadi","redeemer, savior"],["Nasir","helper, protector"],["Rami","archer, marksman"],["Wael","seeking shelter"],
    ],
    girl: [
      ["Layla","night, dark beauty"],["Amira","princess, leader"],["Yasmin","jasmine flower"],["Zara","radiance, blooming flower"],
      ["Aisha","alive, living"],["Farah","joy, happiness"],["Salma","safe, peaceful"],["Rania","gazing, queen"],
      ["Nour","light, radiance"],["Hana","bliss, happiness"],["Lina","tender, palm tree"],["Maryam","beloved, Mary"],
      ["Dalia","dahlia flower"],["Iman","faith, belief"],["Jana","harvest, paradise"],["Rima","white antelope"],
      ["Samira","companion in evening talk"],["Widad","love, affection"],["Zaina","beauty, grace"],["Amal","hope, aspiration"],
      ["Bushra","good news, glad tidings"],["Huda","right guidance"],["Najwa","secret, confidential talk"],["Sana","brilliance, radiance"],
    ],
    unisex: [
      ["Nour","light"],["Jamal","beauty"],["Sami","sublime"],["Rida","contentment"],
    ],
  },
  persian: {
    boy: [
      ["Kian","king, foundation"],["Cyrus","sun, far-sighted"],["Darius","possessor of good"],["Arash","legendary heroic archer"],
      ["Kaveh","legendary blacksmith hero"],["Bijan","hero of the epic"],["Farhad","joy, happiness"],["Sina","named for the philosopher"],
      ["Rostam","tall, mighty epic hero"],["Kourosh","sun, Cyrus"],["Nima","just, fair"],["Babak","young father, protector"],
      ["Kaveh","royal blacksmith"],["Siavash","possessor of black horses"],["Parsa","pious, devout"],["Ramin","of the love story"],
      ["Kamran","successful, fortunate"],["Behrouz","fortunate, prosperous"],["Jamshid","radiant, legendary king"],["Sohrab","illustrious, shining"],
      ["Ardeshir","righteous ruler"],["Farbod","guardian of glory"],["Mani","named for the prophet"],["Roozbeh","fortunate, prosperous"],
    ],
    girl: [
      ["Roya","dream, vision"],["Yasmin","jasmine flower"],["Shirin","sweet, charming"],["Nasrin","wild rose"],
      ["Anahita","goddess of water, immaculate"],["Darya","the sea"],["Setareh","star"],["Mahsa","like the moon"],
      ["Parisa","like a fairy, angelic"],["Ava","voice, sound"],["Golnar","pomegranate flower"],["Nazanin","sweet, lovely"],
      ["Roxana","dawn, bright"],["Soraya","the Pleiades, gem"],["Tara","star"],["Azadeh","free, noble"],
      ["Bahar","spring, springtime"],["Laleh","tulip"],["Mahnaz","glory of the moon"],["Simin","silvery"],
      ["Niloufar","water lily, lotus"],["Parvaneh","butterfly"],["Sahar","dawn, awakening"],["Yalda","longest night, birth"],
    ],
    unisex: [
      ["Kian","king, foundation"],["Sina","named for the philosopher"],["Roya","vision"],["Aria","noble, of the Aryans"],
    ],
  },
  turkish: {
    boy: [
      ["Emir","commander, prince"],["Yusuf","God will add, Joseph"],["Kaan","ruler, king of kings"],["Deniz","the sea"],
      ["Mert","brave, manly"],["Baris","peace"],["Arda","named for the river, worth"],["Cem","gathering, king"],
      ["Efe","elder brother, brave"],["Berk","solid, strong"],["Can","soul, life"],["Ozan","folk poet, bard"],
      ["Tolga","helmet"],["Volkan","volcano"],["Kerem","generosity, nobility"],["Alp","hero, brave"],
      ["Bora","storm, squall"],[" Egemen","sovereign, dominant"],["Sinan","spearhead, named for the architect"],["Tarik","morning star"],
      ["Yigit","brave, valiant"],["Onur","honor, dignity"],["Umut","hope"],["Kaya","rock"],
    ],
    girl: [
      ["Elif","slender, the first letter"],["Zeynep","precious gem, beautiful"],["Defne","laurel tree"],["Ayla","halo of moonlight"],
      ["Nur","light, radiance"],["Ece","queen"],["Derya","the sea, ocean"],["Melisa","honeybee"],
      ["Sude","pure water"],["Yasemin","jasmine"],["Cansu","lively water, soul-water"],["Ela","hazel-eyed"],
      ["Ipek","silk"],["Lale","tulip"],["Nazli","coy, delicate"],["Selin","flowing water"],
      ["Ceylan","gazelle"],["Damla","water drop"],["Esra","journey by night"],["Gizem","mystery"],
      ["Irmak","river"],["Pinar","spring, fountain"],["Sena","praise, brilliance"],["Yaren","close friend"],
    ],
    unisex: [
      ["Deniz","the sea"],["Can","soul, life"],["Bora","storm"],["Umut","hope"],
    ],
  },
  indian: {
    boy: [
      ["Arjun","bright, shining warrior"],["Aarav","peaceful, wisdom"],["Vihaan","dawn, new beginning"],["Rohan","ascending, sandalwood"],
      ["Ishaan","sun, lord Shiva"],["Krishna","dark, divine"],["Aditya","the sun"],["Dev","god, divine"],
      ["Kabir","great, noble"],["Reyansh","ray of light, part of Vishnu"],["Ved","sacred knowledge"],["Ansh","portion, part"],
      ["Advait","unique, non-dual"],["Nikhil","complete, whole"],["Om","sacred sound, universe"],["Rudra","fierce, lord Shiva"],
      ["Shaan","pride, dignity"],["Tarun","young, tender"],["Yash","fame, glory"],["Neel","blue, sapphire"],
      ["Ajay","invincible, unconquered"],["Kiran","ray of light"],["Manav","human, mankind"],["Varun","god of water, sky"],
    ],
    girl: [
      ["Aanya","grace, boundless"],["Diya","lamp, light"],["Priya","beloved, dear"],["Anaya","caring, without a superior"],
      ["Ishani","goddess Parvati, ruler"],["Kavya","poetry, poem"],["Meera","devotee, prosperous"],["Saanvi","goddess Lakshmi"],
      ["Aditi","boundless, mother of gods"],["Riya","singer, graceful"],["Sitara","star"],["Tara","star"],
      ["Anika","grace, goddess Durga"],["Ira","earth, goddess Saraswati"],["Kiara","light, dark-haired"],["Nisha","night"],
      ["Amara","eternal, immortal"],["Devi","goddess"],["Lata","vine, creeper"],["Pooja","worship, prayer"],
      ["Rani","queen"],["Shreya","auspicious, beautiful"],["Uma","goddess Parvati, splendor"],["Veena","musical instrument"],
    ],
    unisex: [
      ["Kiran","ray of light"],["Amar","immortal, eternal"],["Jyoti","light, flame"],["Nihal","content, blissful"],
    ],
  },
  japanese: {
    boy: [
      ["Haruki","shining brightness, spring"],["Ren","lotus, love"],["Sota","sudden, big"],["Yuto","gentle, superior"],
      ["Kaito","ocean, soaring"],["Riku","land, sky"],["Sora","sky"],["Haru","spring, sunlight"],
      ["Takumi","artisan, skillful"],["Hiroshi","generous, prosperous"],["Kenji","strong, wise ruler"],["Daichi","great land, wisdom"],
      ["Yuki","happiness, snow"],["Akira","bright, clear"],["Ryo","refreshing, distant"],["Sho","soar, fly"],
      ["Itsuki","tree, timber"],["Minato","harbor"],["Asahi","morning sun"],["Kenta","healthy, big"],
      ["Naoki","honest tree"],["Tsubasa","wings"],["Hayato","falcon person"],["Makoto","sincerity, truth"],
    ],
    girl: [
      ["Sakura","cherry blossom"],["Yui","gentleness, bind"],["Hana","flower"],["Aoi","hollyhock, blue"],
      ["Mei","sprout, bright"],["Rin","dignified, cold"],["Yuna","gentle, lush"],["Hina","sun, vegetable"],
      ["Emi","beautiful blessing"],["Sora","sky"],["Kokoro","heart, mind"],["Mio","beautiful cherry blossom"],
      ["Akari","light, brightness"],["Nana","seven, greens"],["Yuki","snow, happiness"],["Momo","peach"],
      ["Ayaka","colorful flower"],["Haruka","distant, spring flower"],["Rei","lovely, bell"],["Tsubaki","camellia"],
      ["Kaede","maple leaf"],["Miyu","beautiful gentleness"],["Nao","honest, calm"],["Yuzuki","gentle moon"],
    ],
    unisex: [
      ["Haru","spring, sun"],["Sora","sky"],["Yuki","snow, happiness"],["Aoi","blue, hollyhock"],["Makoto","sincerity"],["Hikaru","light, radiance"],
    ],
  },
  chinese: {
    boy: [
      ["Wei","great, extraordinary"],["Hao","great, vast"],["Jun","handsome, talented"],["Ming","bright, brilliant"],
      ["Lei","thunder"],["Feng","wind, phoenix"],["Bo","waves, elder"],["Chen","morning, vast"],
      ["Kang","health, well-being"],["Long","dragon"],["Peng","legendary giant bird"],["Tao","great waves, peach"],
      ["Yang","sun, positive"],["Zhi","ambition, will"],["Bin","refined, cultivated"],["Cheng","accomplished, honest"],
      ["Hong","vast, grand"],["Jian","strong, healthy"],["Kai","victory, triumph"],["Sheng","victory, holy"],
      ["Xiang","to soar, auspicious"],["Yong","brave, eternal"],["Zhen","precious, to shake"],["Jing","capital, quiet"],
    ],
    girl: [
      ["Mei","beautiful, plum blossom"],["Ling","delicate, spirit"],["Hua","flower, magnificent"],["Yan","swallow, beautiful"],
      ["Jing","quiet, essence"],["Xia","glow of sunrise, summer"],["Lan","orchid"],["Fang","fragrant"],
      ["Li","beautiful, reason"],["Na","elegant, graceful"],["Qing","clear, blue-green"],["Wen","gentle, cultured"],
      ["Ying","flower, brave"],["Zhen","precious, pearl"],["Bai","white, pure"],["Chun","spring"],
      ["Hui","wise, intelligent"],["Jiao","charming, delicate"],["Min","quick, clever"],["Ping","peaceful, level"],
      ["Rou","gentle, soft"],["Xue","snow, studious"],["Yun","cloud, harmony"],["Zhu","pearl, bamboo"],
    ],
    unisex: [
      ["Yi","harmony, resolute"],["Xin","new, heart"],["Jia","excellent, family"],["An","peace, tranquility"],["Le","joy, happiness"],["Yu","jade, universe"],
    ],
  },
  korean: {
    boy: [
      ["Min-jun","clever and talented"],["Seo-jun","auspicious and handsome"],["Do-yun","path and allow"],["Ji-ho","wisdom and great"],
      ["Ha-joon","summer and handsome"],["Eun-woo","kindness and universe"],["Si-woo","beginning and divine help"],["Joon-ho","talented and great"],
      ["Tae-yang","sun, the great"],["Ji-hoon","wisdom and rank"],["Hyun-woo","virtuous and divine"],["Min-ho","clever and great"],
      ["Seung","victory, succeeding"],["Jin-woo","precious and divine"],["Woo-jin","divine and precious"],["Sung-min","success and cleverness"],
      ["Yun-seo","allow and auspicious"],["Kang","strong, powerful"],["Dae","great, big"],["Ho","great, goodness"],
      ["Jae","talent, wealth"],["Jun","talented, handsome"],["Nam","south"],["Young","flower, eternal"],
    ],
    girl: [
      ["Seo-yeon","auspicious and beautiful"],["Ji-woo","wisdom and universe"],["Ha-eun","summer and kindness"],["Seo-ah","auspicious and elegant"],
      ["Ji-a","wisdom and beautiful"],["Soo-ah","excellence and elegant"],["Ye-jin","talented and precious"],["Yu-na","abundant and graceful"],
      ["Da-eun","abundant kindness"],["Chae-won","color and beginning"],["Ji-min","wisdom and cleverness"],["Ha-yoon","summer and allow"],
      ["Eun-ji","kindness and wisdom"],["Min-seo","cleverness and auspicious"],["Su-bin","excellence and refinement"],["Ye-eun","art and grace"],
      ["Hana","one, first"],["Bo-ram","worthwhile, rewarding"],["Sae-rom","new, fresh"],["A-ri","clever, dear"],
      ["Mi-rae","future"],["Na-yeon","graceful lotus"],["So-ra","conch shell, sky"],["Yeong","brave, flower"],
    ],
    unisex: [
      ["Ji-woo","wisdom and universe"],["Seung","victory"],["Ha-eun","grace of summer"],["Yu-jin","abundant and precious"],
    ],
  },
  african: {
    boy: [
      ["Kwame","born on Saturday"],["Jabari","brave, fearless"],["Amari","strength, builder"],["Sekou","learned, warrior"],
      ["Chike","power of God"],["Themba","hope, trust"],["Kofi","born on Friday"],["Zuberi","strong"],
      ["Baraka","blessing"],["Tafari","he who inspires awe"],["Simba","lion"],["Jelani","mighty, powerful"],
      ["Kato","second of twins"],["Oba","king"],["Chuma","wealth, beads"],["Bakari","noble promise"],
      ["Dumisani","one who praises, exalts"],["Femi","love me, God loves me"],["Nuru","light, born in daylight"],["Sefu","sword"],
      ["Tendai","be thankful"],["Uzoma","good path, well-born"],["Yohance","God's gift"],["Zola","quiet, tranquil"],
    ],
    girl: [
      ["Amara","grace, mercy"],["Zuri","beautiful"],["Nia","purpose, intention"],["Ayana","beautiful flower, gift"],
      ["Imani","faith, belief"],["Sanaa","work of art, brilliance"],["Thandiwe","beloved one"],["Folami","respect and honor me"],
      ["Zola","tranquil, love"],["Ada","first daughter"],["Chiamaka","God is beautiful, splendid"],["Aisha","alive, living"],
      ["Kesse","born on a fat, plentiful day"],["Nala","successful, beloved"],["Oni","born in a sacred place"],["Sauda","dark beauty"],
      ["Zalika","well-born, noble"],["Amina","trustworthy, faithful"],["Dalila","gentle, delicate"],["Halima","gentle, patient"],
      ["Kamaria","like the moon"],["Layla","night, dark beauty"],["Makena","the happy one"],["Nadia","caller, announcer"],
    ],
    unisex: [
      ["Amari","strength"],["Zola","tranquil"],["Baraka","blessing"],["Nuru","light"],["Sisi","born on Sunday"],["Bahati","luck, fortune"],
    ],
  },
  hawaiian: {
    boy: [
      ["Kai","the sea"],["Keanu","the cool breeze"],["Ikaika","strong, powerful"],["Makoa","fearless, courageous"],
      ["Keoni","God is gracious"],["Kekoa","the brave one, warrior"],["Manu","bird"],["Koa","warrior, brave, koa tree"],
      ["Nainoa","the calling, naming"],["Kaimana","power of the ocean, diamond"],["Lono","god of peace and agriculture"],["Palani","free man"],
      ["Kanoa","the free one, commoner"],["Akoni","priceless, worthy of praise"],["Nohea","handsome, lovely"],["Kale","strong, manly"],
      ["Kimo","supplanter"],["Lani","sky, heaven"],["Mele","song, melody"],["Pono","righteous, proper"],
    ],
    girl: [
      ["Leilani","heavenly flower, royal child"],["Malia","calm, beloved"],["Nalani","the heavens, serenity"],["Kaila","style, stylish"],
      ["Alana","offering, awakening, beauty"],["Moana","ocean, wide expanse"],["Noelani","mist of heaven"],["Kalani","the sky, chieftain"],
      ["Iolana","to soar like a hawk"],["Lani","sky, heaven"],["Ilima","the native flower"],["Kailani","sea and sky"],
      ["Lokelani","heavenly rose"],["Anela","angel"],["Healani","haze of heaven"],["Kapua","the flower, blossom"],
      ["Luana","content, enjoyment"],["Mahina","the moon"],["Nani","beauty, glory"],[" Palila","named for the bird"],
      ["Ulani","cheerful, lighthearted"],["Wailani","heavenly water"],["Kiele","gardenia, fragrant"],["Pua","flower, offspring"],
    ],
    unisex: [
      ["Kai","the sea"],["Hoku","star"],["Nohea","lovely, handsome"],["Lani","sky, heaven"],["Alaula","dawn, first light"],["Kanoa","the free one"],
    ],
  },
  american: {
    boy: [
      ["Mason","stoneworker, builder"],["Logan","little hollow"],["Jackson","son of Jack"],["Carter","cart driver"],
      ["Hunter","one who hunts"],["Wyatt","brave in war"],["Grayson","son of the steward"],["Colton","from the coal town"],
      ["Hudson","son of Hugh"],["Brayden","broad, brave"],["Landon","long hill"],["Easton","east-facing town"],
      ["Bryce","speckled, freckled"],["Cooper","barrel maker"],["Parker","park keeper"],["Ryder","horseman, messenger"],
      ["Beckett","beehive, bee cottage"],["Tucker","cloth fuller"],["Weston","western town"],["Chase","huntsman"],
      ["Brody","ditch, muddy place"],["Kayden","fighter, companion"],["Maverick","independent, unbranded"],["Bentley","meadow with bent grass"],
      ["Zane","God is gracious"],["Tanner","leather worker"],["Jaxon","son of Jack"],["Ryker","becoming rich, strength"],
    ],
    girl: [
      ["Harper","harp player"],["Addison","son of Adam"],["Peyton","fighting man's estate"],["Brooklyn","broken land, water"],
      ["Kinsley","king's meadow"],["Everly","grazing meadow"],["Paisley","church, patterned"],["Reagan","little ruler"],
      ["Kennedy","helmeted chief"],["Aubree","elf ruler"],["Skylar","scholar, sky"],["Emberly","spark, ember meadow"],
      ["Presley","priest's meadow"],["Oakley","oak clearing"],["Marlowe","driftwood, hill by the lake"],["Sawyer","woodcutter"],
      ["Blakely","dark meadow"],["Adalyn","noble"],["Kaylee","slender, keeper of keys"],["Journee","journey"],
      ["Charleigh","free woman"],["Emerson","brave, son of Emery"],["Hadley","heather field"],["Raelynn","ewe, graceful"],
    ],
    unisex: [
      ["Jordan","to flow down, descend"],["Taylor","tailor"],["Morgan","sea-born, bright"],["Peyton","noble estate"],
      ["Avery","ruler of elves"],["Kendall","valley of the river Kent"],["Dakota","friend, ally"],["Phoenix","dark red, rebirth"],
      ["River","flowing water"],["Justice","fairness, uprightness"],
    ],
  },
  russian: {
    boy: [
      ["Aleksandr","defender of the people"],["Maksim","greatest"],["Artyom","unharmed, healthy"],["Dmitriy","devoted to Demeter"],
      ["Yaroslav","fierce and glorious"],["Vladislav","to rule with glory"],["Andrei","manly, brave"],["Timofey","honoring God"],
      ["Kirill","lordly, masterful"],["Oleg","holy, blessed"],["Igor","warrior of peace"],["Grigoriy","watchful, vigilant"],
      ["Yuri","farmer, earthworker"],["Roman","of Rome"],["Fyodor","gift of God"],["Vadim","to allure, ruler"],
      ["Lev","lion"],["Gleb","heir of God, kind"],["Semyon","God has heard"],["Vsevolod","ruler of all"],
      ["Ilya","the Lord is my God"],["Pavel","small, humble"],["Konstantin","steadfast, constant"],["Yegor","farmer"],
    ],
    girl: [
      ["Ekaterina","pure"],["Anastasiya","resurrection"],["Yekaterina","pure, clear"],["Polina","small, humble"],
      ["Sofiya","wisdom"],["Alina","bright, noble"],["Kseniya","hospitable, guest"],["Yuliya","youthful"],
      ["Marina","of the sea"],["Galina","calm, serene"],["Larisa","citadel, seagull"],["Oksana","hospitality, praise"],
      ["Tatyana","fairy queen"],["Yelena","bright, shining light"],["Alyona","light, torch"],["Varvara","stranger, traveler"],
      ["Zinaida","born of Zeus"],["Raisa","easygoing, rose"],["Lyudmila","dear to the people"],["Nadezhda","hope"],
      ["Vasilisa","royal, queenly"],["Darya","possessing goodness"],["Yevgeniya","noble, well-born"],["Snezhana","snowy, snow maiden"],
    ],
    unisex: [
      ["Sasha","defender of mankind"],["Zhenya","noble, well-born"],["Valya","strong, healthy"],["Slava","glory, fame"],
    ],
  },
  polish: {
    boy: [
      ["Jakub","supplanter"],["Szymon","he has heard"],["Kacper","treasurer"],["Filip","lover of horses"],
      ["Wojciech","joyful warrior"],["Mateusz","gift of God"],["Bartosz","son of the furrow"],["Krzysztof","bearer of Christ"],
      ["Tomasz","twin"],["Michal","who is like God"],["Grzegorz","watchful, vigilant"],["Piotr","rock, stone"],
      ["Mikolaj","victory of the people"],["Dawid","beloved"],["Jan","God is gracious"],["Aleksander","defender of the people"],
      ["Marek","warlike"],["Pawel","small, humble"],["Zbigniew","to dispel anger"],["Henryk","home ruler"],
      ["Igor","warrior of peace"],["Kamil","attendant, noble"],["Oskar","spear of the gods"],["Wiktor","conqueror"],
    ],
    girl: [
      ["Zofia","wisdom"],["Julia","youthful"],["Maja","great, splendid"],["Lena","bright, shining"],
      ["Alicja","noble, kind"],["Wiktoria","victory"],["Aleksandra","defender of the people"],["Natalia","born on Christmas"],
      ["Gabriela","God is my strength"],["Kinga","brave in war"],["Agnieszka","pure, holy"],["Malgorzata","pearl"],
      ["Katarzyna","pure"],["Ewa","life, living one"],["Iwona","yew tree"],["Kasia","pure"],
      ["Bozena","blessed, divine gift"],["Danuta","given by God"],["Halina","calm, light"],["Jadwiga","battle, refuge"],
      ["Weronika","true image"],["Zuzanna","lily, graceful"],["Karolina","free woman"],["Oliwia","olive tree, peace"],
    ],
    unisex: [
      ["Nikodem","victory of the people"],["Ada","noble"],["Alex","defender"],["Kris","bearer of Christ"],
    ],
  },
  portuguese: {
    boy: [
      ["Miguel","who is like God"],["Joao","God is gracious"],["Pedro","rock, stone"],["Tiago","supplanter"],
      ["Rafael","God has healed"],["Gabriel","God is my strength"],["Gustavo","staff of the Goths"],["Bernardo","brave as a bear"],
      ["Rodrigo","famous ruler"],["Vicente","conquering"],["Diogo","supplanter"],["Bruno","brown, armor"],
      ["Henrique","home ruler"],["Lucas","bringer of light"],["Thiago","supplanter"],["Caio","rejoice, glad"],
      ["Duarte","wealthy guardian"],["Afonso","noble and ready"],["Nuno","ninth, grave"],["Vasco","from the Basque country"],
      ["Ravi","sun"],["Davi","beloved"],["Enzo","ruler of the home"],["Murilo","little wall, enclosure"],
    ],
    girl: [
      ["Maria","beloved, bitter"],["Ana","grace, favor"],["Beatriz","she who brings joy"],["Mariana","grace and beloved"],
      ["Leonor","bright, shining light"],["Matilde","mighty in battle"],["Ines","pure, holy"],["Carolina","free woman"],
      ["Catarina","pure"],["Sofia","wisdom"],["Rita","pearl"],["Luana","content, moon-lit"],
      ["Manuela","God is with us"],["Camila","attendant"],["Helena","bright, shining"],["Joana","God is gracious"],
      ["Vitoria","victory"],["Bianca","white, pure"],["Alice","noble"],["Laura","laurel, victory"],
      ["Clara","bright, clear"],["Isabela","pledged to God"],["Yara","water lady, of the myth"],["Nina","dreamer, grace"],
    ],
    unisex: [
      ["Ariel","lion of God"],["Yuri","farmer"],["Noa","motion, rest"],["Kai","sea, from the ocean"],
    ],
  },
  vietnamese: {
    boy: [
      ["Minh","bright, intelligent"],["An","peace, safety"],["Bao","protection, treasure"],["Duc","virtue, moral"],
      ["Khang","prosperous, healthy"],["Long","dragon"],["Nam","south, masculine"],["Phuc","blessing, good fortune"],
      ["Quang","bright, clear"],["Son","mountain"],["Tuan","handsome, intelligent"],["Vinh","glory, bay"],
      ["Hung","brave, heroic"],["Khanh","congratulation, jade chime"],["Thanh","brilliant, pure"],["Trung","loyalty, middle"],
      ["Anh","hero, bright"],["Dung","brave, heroic"],["Hoang","royal, phoenix"],["Kiet","outstanding, hero"],
      ["Phong","wind, style"],["Tai","talent, wealth"],["Duy","only, the one"],["Nghia","righteousness, loyalty"],
    ],
    girl: [
      ["Linh","spirit, gentle soul"],["Mai","apricot blossom"],["Anh","bright, cherry blossom"],["Ngoc","jade, gem"],
      ["Huong","fragrance, perfume"],["Lan","orchid"],["Thao","respectful, herb"],["Trang","elegant, bright"],
      ["Yen","peaceful, swallow bird"],["Chi","branch, will"],["Dao","peach blossom"],["Hoa","flower"],
      ["Kim","gold, metal"],["My","beautiful, pretty"],["Nhi","little one, second daughter"],["Phuong","phoenix, direction"],
      ["Quyen","graceful, beautiful"],["Thu","autumn"],["Tuyet","snow"],["Van","cloud, literature"],
      ["Bich","emerald, jade green"],["Diep","leaf"],["Ha","river, summer"],["Suong","dew, mist"],
    ],
    unisex: [
      ["An","peace"],["Anh","bright, intelligent"],["Ha","river, summer"],["Nhan","kindness, benevolence"],["Hai","sea, ocean"],["Tam","heart, mind"],
    ],
  },
  filipino: {
    boy: [
      ["Mateo","gift of God"],["Gabriel","God is my strength"],["Angelo","messenger, angel"],["Rafael","God has healed"],
      ["Emmanuel","God is with us"],["Miguel","who is like God"],["Jose","God will add"],["Andres","manly, brave"],
      ["Ramon","wise protector"],["Diego","supplanter"],["Carlos","free man"],["Antonio","priceless"],
      ["Bayani","hero"],["Dakila","great, noble"],["Makisig","dashing, elegant"],["Amado","beloved"],
      ["Danilo","God is my judge"],["Ernesto","serious, resolute"],["Rizal","named for the national hero"],["Bautista","baptist"],
      ["Liwanag","light, brightness"],["Tala","bright star"],["Kidlat","lightning"],["Bagwis","wings, feather"],
    ],
    girl: [
      ["Maria","beloved, bitter"],["Sofia","wisdom"],["Isabela","pledged to God"],["Andrea","manly, brave"],
      ["Angela","messenger, angel"],["Cristina","follower of Christ"],["Rosa","rose"],["Corazon","heart"],
      ["Luzviminda","light of the three islands"],["Dalisay","pure, sincere"],["Ligaya","joy, happiness"],["Liwayway","dawn, daybreak"],
      ["Marikit","beautiful, lovely"],["Perlas","pearl"],["Diwata","fairy, muse, goddess"],["Bituin","star"],
      ["Amihan","northeast winter wind"],["Halina","come, welcome"],["Malaya","free, liberated"],["Sinag","ray of light"],
      ["Reyna","queen"],["Mahalia","tenderness, affection"],["Bulan","moon"],["Hiraya","imagination, hope fulfilled"],
    ],
    unisex: [
      ["Tala","star"],["Liwanag","light"],["Malaya","free"],["Ligaya","joy"],
    ],
  },
};

let idn = 0;
const names = [];
const seenPerCulture = {};
for (const [culture, groups] of Object.entries(DATA)) {
  seenPerCulture[culture] ||= new Set();
  for (const gender of ["boy", "girl", "unisex"]) {
    for (const entry of groups[gender] || []) {
      const [rawName, meaning] = Array.isArray(entry) ? entry : [entry, null];
      const name = String(rawName).trim();
      const key = name.toLowerCase();
      if (!name || seenPerCulture[culture].has(key)) continue; // dedupe within a culture
      seenPerCulture[culture].add(key);
      names.push({
        id: `n${++idn}`,
        name,
        gender,
        culture,
        origin: CULTURES[culture].label,
        meaning: meaning ? String(meaning).trim() : null,
        pronounce: PRON[name] || null,
        alts: ALTS[name] || null,
      });
    }
  }
}

const out = {
  generatedAt: new Date().toISOString(),
  cultures: CULTURES,
  count: names.length,
  names,
};

mkdirSync(`${__dirname}/../public`, { recursive: true });
writeFileSync(`${__dirname}/../public/names.json`, JSON.stringify(out, null, 0));

// Per-culture tally for a quick sanity check when regenerating.
const tally = {};
for (const n of names) tally[n.culture] = (tally[n.culture] || 0) + 1;
console.log(`Wrote ${names.length} names across ${Object.keys(CULTURES).length} cultures.`);
console.log(Object.entries(tally).map(([k, v]) => `  ${k}: ${v}`).join("\n"));
