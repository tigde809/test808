import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Dragon, Rarity, ElementType, TIER_1_ELEMENTS, TIER_2_ELEMENTS, TIER_3_ELEMENTS, TIER_4_ELEMENTS, DROP_RATES } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-3-flash-preview';

// Schema for structured JSON output
const dragonSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Имя дракона" },
    content: { type: Type.STRING, description: "Поэтическое описание или лор дракона" },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Характеристики (например: Чешуя, Крылья, Дыхание)",
    },
  },
  required: ["name", "content", "tags"],
};

const getRandomElement = (rarity: Rarity): ElementType => {
  const rand = Math.random();
  const rates = DROP_RATES[rarity];
  
  let cumulative = 0;
  let selectedTier = 1;

  // Iterate through defined rates to find the tier
  const tiers = Object.keys(rates).map(Number).sort((a, b) => a - b);
  
  for (const tier of tiers) {
    cumulative += rates[tier];
    if (rand <= cumulative) {
      selectedTier = tier;
      break;
    }
  }

  // Fallback to highest tier if rounding error (shouldn't happen with math.random)
  if (rand > cumulative) selectedTier = tiers[tiers.length - 1];

  switch (selectedTier) {
    case 1: return TIER_1_ELEMENTS[Math.floor(Math.random() * TIER_1_ELEMENTS.length)];
    case 2: return TIER_2_ELEMENTS[Math.floor(Math.random() * TIER_2_ELEMENTS.length)];
    case 3: return TIER_3_ELEMENTS[Math.floor(Math.random() * TIER_3_ELEMENTS.length)];
    case 4: return TIER_4_ELEMENTS[Math.floor(Math.random() * TIER_4_ELEMENTS.length)];
    default: return TIER_1_ELEMENTS[0];
  }
};

export const generateDragonFromChest = async (rarity: Rarity): Promise<Omit<Dragon, 'id'>> => {
  const element = getRandomElement(rarity);
  const systemInstruction = "Ты — 'Драконья Сокровищница'. Ты создаешь уникальных драконов на основе стихий.";

  const prompt = `
    Создай дракона стихии: ${element}.
    Уровень редкости сундука: ${rarity} звезд(ы).
    
    1. Придумай ему красивое фэнтези имя.
    2. Напиши короткое, но эпичное описание (можно в рифму или как легенду), раскрывающее его суть и связь со стихией ${element}.
    3. Добавь 2-3 тега (характеристики).
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: dragonSchema,
        temperature: 0.9,
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No text returned from API");

    const data = JSON.parse(jsonText);

    return {
      name: data.name,
      content: data.content,
      tags: data.tags,
      rarity: rarity,
      element: element
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Не удалось призвать дракона...");
  }
};

export const breedDragons = async (d1: Dragon, d2: Dragon): Promise<Omit<Dragon, 'id'>> => {
  // Logic: 
  // If same rarity: Upgrade (+1), max 4.
  // If diff rarity: Keep the MAX rarity of the two parents (no upgrade, just mixing).
  
  let newRarity: Rarity;
  
  if (d1.rarity === d2.rarity) {
    newRarity = (Math.min(d1.rarity + 1, 4)) as Rarity;
  } else {
    newRarity = (Math.max(d1.rarity, d2.rarity)) as Rarity;
  }
  
  const systemInstruction = "Ты — Мастер Драконов. Ты скрещиваешь двух драконов, создавая новый вид.";
  
  const prompt = `
    Скрести двух драконов:
    1. "${d1.name}" (Стихия: ${d1.element}, Редкость: ${d1.rarity}*, Описание: ${d1.content})
    2. "${d2.name}" (Стихия: ${d2.element}, Редкость: ${d2.rarity}*, Описание: ${d2.content})

    Цель: Создать нового дракона уровня ${newRarity} звезды.
    
    Задачи:
    1. Определи новую стихию для потомка. 
       - Если редкость родителей разная, стихия может быть ближе к более редкому родителю.
       - Если одинаковая, это может быть мутация.
       Список доступных стихий: Огонь, Ветер, Земля, Вода, Зелень, Металл, Энергия, Пустота, Тень, Свет, Легендарный, Первородный, Божественный, Древний, Тиран.
    2. Дай ему имя.
    3. Напиши описание, объясняющее его происхождение от двух родителей.
    4. Теги.
  `;

  const breedSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      content: { type: Type.STRING },
      tags: { type: Type.ARRAY, items: { type: Type.STRING } },
      newElement: { 
        type: Type.STRING, 
        description: "Выбери одну стихию из списка: Огонь, Ветер, Земля, Вода, Зелень, Металл, Энергия, Пустота, Тень, Свет, Легендарный, Первородный, Божественный, Древний, Тиран",
        enum: ['Огонь', 'Ветер', 'Земля', 'Вода', 'Зелень', 'Металл', 'Энергия', 'Пустота', 'Тень', 'Свет', 'Легендарный', 'Первородный', 'Божественный', 'Древний', 'Тиран']
      },
    },
    required: ["name", "content", "tags", "newElement"],
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: breedSchema,
        temperature: 0.95,
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No text returned from API");
    const data = JSON.parse(jsonText);

    return {
      name: data.name,
      content: data.content,
      tags: data.tags,
      rarity: newRarity,
      element: data.newElement as ElementType
    };
  } catch (error) {
    console.error("Gemini API Crafting Error:", error);
    throw new Error("Скрещивание не удалось. Драконы отвергли друг друга.");
  }
};