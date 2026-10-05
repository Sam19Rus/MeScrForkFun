/* orders.ts — шаблоны заказов клиентов (18 шт., перенесены 1-в-1 из прототипа). */
import raw from './raw/order_templates.json';
import type { OrderTemplate } from '../types';

export const ORDER_TEMPLATES = raw as OrderTemplate[];
