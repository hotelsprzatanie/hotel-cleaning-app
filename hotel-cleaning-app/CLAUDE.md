# Hotel Cleaning App

## Opis
Aplikacja do zarządzania sprzątaniem hotelu.
Manager przydziela zadania, sprzątaczki je wykonują.

## Stack
- React + Tailwind CSS (frontend)
- Node.js + Express (backend)
- SQLite z better-sqlite3 (baza danych)
- PWA (działa na telefonie)

## Zakładki w aplikacji
1. Pokoje — checkout i serwis dzienny
2. Części wspólne — toalety, korytarze, jadalnia, schody
3. Usterki — zgłaszanie i śledzenie usterek
4. Inne — dowolne dodatkowe zadania tekstowe

## Typy zadań (pokoje)
- checkout — pełne sprzątanie po wymeldowaniu
- serwis — sprzątanie przy zamieszkałym gościu
- brak — pokój nie wymaga sprzątania

## Statusy
pending → in_progress → done → verified

## Statusy usterek
new → in_progress → fixed

## Priorytety usterek
normal | urgent

## Role
- manager — pełny dostęp
- sprzątaczka — widzi swoje zadania, zmienia statusy, zgłasza usterki

## Zasady kodowania
- Komentarze po polsku
- Nazwy zmiennych/funkcji po angielsku
- Mobile-first
- Zawsze waliduj dane po stronie backendu

## Czego NIE robić
- Nie używaj zewnętrznych płatnych API
- Nie komplikuj — to MVP
