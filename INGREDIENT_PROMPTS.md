# פרומפטים לחילוץ מצרכים בנפרד — היסטוריה (כבר בוצע)

כל 11 האובייקטים כבר נוצרו, עברו chroma-key (`scripts/chroma_key.py`) ומחוברים באתר תחת `assets/img/`:
`olive-branch.png`, `olive-leaves.png`, `olives-suri.png`, `olives-barnea.png`, `olives-green.png`,
`artichoke.png`, `chili.png`, `herbs.png`, `tomato.png`, `walnuts.png`, `lemon-peel.png`.

קובץ זה נשמר כתיעוד היסטורי של הפרומפטים המקוריים, למקרה שיידרש ליצור אובייקט נוסף באותה שיטה
(רקע מגנטה `#FF00FF` שטוח, ללא צל, תאורה עקבית) בעתיד.

## תבנית כללית לאובייקט בודד
```
[Object description], isolated completely alone, lying flat, photorealistic [macro detail / texture notes].
Centered in frame, on a solid flat uniform chroma-key background, fully saturated bright magenta color
hex #FF00FF, filling the entire frame edge to edge, no gradient, no vignette, no texture.
Soft even studio lighting from the upper-left, matching premium product photography.
NO cast shadow. Clean sharp edges, no motion blur, no magenta color-spill or fringing. Aspect ratio 4:3. --ar 4:3
```

עיבוד: `python scripts/chroma_key.py <input.jpg> <output.png> magenta 50` (טולרנס 35-65 לפי הצורך),
ואז crop לתיבת התוכן (ראה שימוש בסקריפט בהיסטוריית הפרויקט).
