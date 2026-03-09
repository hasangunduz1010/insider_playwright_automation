## 📸 Playwright Snapshot Kullanımı (Visual Testing)

### 🆕 İlk Kez Snapshot Oluşturma / Güncelleme

```bash
npx playwright test --project=visual --update-snapshots
```

* Snapshot **yoksa oluşturur**
* Snapshot **varsa üzerine yazar**
* Mevcut ekran görüntüsünü **doğru kabul eder ve kaydeder**

> `--update-snapshots` = “Bu hali doğru kabul et, kaydet.”

---

### 🔍 Normal Test Çalıştırma (Karşılaştırma)

```bash
npx playwright test --project=visual
```

* Snapshot **varsa karşılaştırır**
* Fark varsa **test fail eder**
* Snapshot **yoksa test fail eder**
* **Asla yeni snapshot yazmaz**

> `--update-snapshots` yok = “Sakladığım ile karşılaştır, fark varsa fail et.”

---

## 🎯 Kontrol Tamamen Sende

| Komut                    | Davranış                                 |
| ------------------------ | ---------------------------------------- |
| `--update-snapshots`     | Mevcut hali doğru kabul eder ve kaydeder |
| `--update-snapshots` yok | Kaydedilen snapshot ile karşılaştırır    |

---

### 💡 Önerilen Akış

1. UI değişikliği yaptıktan sonra:

   ```bash
   npx playwright test --project=visual --update-snapshots
   ```

2. CI / normal test sürecinde:

   ```bash
   npx playwright test --project=visual
   ```

---

İstersen bunu README içine koymalık daha kurumsal bir versiyon da hazırlayabilirim.
