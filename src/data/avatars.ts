import { AvatarOption } from '../types';

export const MONSTER_AVATARS: AvatarOption[] = [
  {
    id: 'sulley',
    name: 'Giga Peludinho',
    monsterType: 'Monstro Gigante Azul',
    bgGradient: 'from-cyan-500 to-blue-600',
    url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'mike',
    name: 'Zoiudinho',
    monsterType: 'Monstro de Um Olho Só Verde',
    bgGradient: 'from-lime-400 to-emerald-600',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'boo',
    name: 'Fantasiadinho',
    monsterType: 'Exploradora Disfarçada',
    bgGradient: 'from-fuchsia-400 to-pink-600',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'randall',
    name: 'Camaleão Camuflado',
    monsterType: 'Monstro Roxo Espertinho',
    bgGradient: 'from-purple-500 to-indigo-700',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'celia',
    name: 'Cabelo Serpente',
    monsterType: 'Monstra Elegante',
    bgGradient: 'from-rose-400 to-purple-600',
    url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'art',
    name: 'Arco-Íris Maluco',
    monsterType: 'Monstro em Forma de A',
    bgGradient: 'from-purple-400 to-amber-500',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'squishy',
    name: 'Fofinho Gelatina',
    monsterType: 'Monstro Vários Olhos',
    bgGradient: 'from-amber-300 to-orange-500',
    url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'roz',
    name: 'Gerente Lesma',
    monsterType: 'Inspectora Exigente',
    bgGradient: 'from-emerald-500 to-teal-800',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300&auto=format&fit=crop&q=80',
  }
];

export const DEFAULT_TASKS = [
  // Tarefas Positivas
  { name: 'Arrumar a cama ao acordar', type: 'positive', value: 2, category: 'Organização', level: 'leve', recoverable: false },
  { name: 'Fazer o dever de casa sem reclamar', type: 'positive', value: 5, category: 'Estudos', level: 'médio', recoverable: false },
  { name: 'Guardar os brinquedos após brincar', type: 'positive', value: 3, category: 'Organização', level: 'leve', recoverable: false },
  { name: 'Escovar os dentes após as refeições', type: 'positive', value: 2, category: 'Saúde & Higiene', level: 'leve', recoverable: false },
  { name: 'Ajudar a colocar/tirar a mesa do jantar', type: 'positive', value: 4, category: 'Família', level: 'médio', recoverable: false },
  { name: 'Ler 15 minutos de um livro', type: 'positive', value: 5, category: 'Estudos', level: 'médio', recoverable: false },
  { name: 'Alimentar o pet ou cuidar da planta', type: 'positive', value: 3, category: 'Responsabilidade', level: 'leve', recoverable: false },
  { name: 'Comer frutas e vegetais na refeição', type: 'positive', value: 3, category: 'Saúde & Higiene', level: 'leve', recoverable: false },

  // Comportamentos Negativos (Multas)
  { name: 'Dar birra ou gritar com os pais', type: 'negative', value: 4, category: 'Comportamento', level: 'médio', recoverable: true },
  { name: 'Não guardar o celular/videogame na hora', type: 'negative', value: 3, category: 'Regras de Casa', level: 'leve', recoverable: true },
  { name: 'Deixar roupa suja jogada no chão', type: 'negative', value: 2, category: 'Organização', level: 'leve', recoverable: true },
  { name: 'Responder com desrespeito ou morder/chutar', type: 'negative', value: 8, category: 'Comportamento', level: 'grave', recoverable: false },
  { name: 'Faltar com a verdade / Mentir', type: 'negative', value: 6, category: 'Valores', level: 'grave', recoverable: false },
];
