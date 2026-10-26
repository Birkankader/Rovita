# Yakın zoom yamasını kaynağa uygulama

6 dosya değişiyor:

- Değişikliklerin çoğu **yeni metot ekleme**.
- Geri kalanı, mevcut bir satırın sonuna `- origin` eklemek ya da bir satırın altına tek satırlık bir çağrı eklemek.
- Satır numarası yerine **aranacak metni** veriyorum. Decompile edilmiş koddan çıkardığım için parametre adları sizin kaynakta farklı olabilir; yapı aynı.

Sıra önemli değil, ama derlemenin arada kırılmaması için 1 → 6 sırasıyla gitmek en kolayı.

3D (Map3D) için ek adımlar 7 → 11'de. Bunlar aynı dosyalardan beşine ek yapar; 1–6 uygulanmış olmalı.

> **Bu kılavuzun önceki bir sürümünü uyguladıysanız:** `TGLDesktopJOGL2`'de eskiden iki ayrı aynalama vardı. 2D'ninki `cameraTracked`/`levelTranslation`, 3D'ninki `globeTracked`/`globeMatrices` ile çalışıyordu. Artık tek aynalama var.
> 1. Bu dosyadaki eski alanları ve `track…`/`trackGlobe…` metotlarını silin.
> 2. Wrapper metotlarına eklenmiş `track…` satırlarını silin.
> 3. Adım 2'yi ve 8'i baştan uygulayın.
>
> Diğer dosyalar değişmedi.

> **3d'yi daha önce uyguladıysanız (Cassini düzeltmesi):** 3d'de `beginLocalOrigin`'in içindeki `if` koşulu ve `LocalOriginOfPoints` sınıfı değişti. İkisini 3d'deki yeni haliyle değiştirin; başka bir şey değişmedi.

---

## 1. `tr/com/havelsan/tmap/api/view/gpu/AGISGL.java`

Import: `import java.util.Arrays;`

Alanlar ve metotlar (sınıfın içine, örneğin `glTranslated` soyut metodunun hemen altına):

```java
   private double[] vertexOrigins = new double[16];
   private int vertexOriginCount = 0;
   private double vertexOriginX = 0.0;
   private double vertexOriginY = 0.0;

   /**
    * Applies the map centre translation, the negated projected centre of the map. The GL keeps its matrices in single
    * precision, which rounds this translation to about 0.4 m at Turkey's longitudes; an implementation that remembers it
    * can place graphics precisely with {@link #glTranslateToMapPoint}. This one only translates.
    */
   public void glTranslateCamera(double x, double y, double z) {
      this.glTranslated(x, y, z);
   }

   /**
    * Translates the modelview by the projected map distance (x, y). An implementation that knows the modelview is the
    * map centre translation plus translations adds them up in double precision and loads the result, so vertices given
    * relative to the point land where the map centre puts them to within a fraction of a pixel at any zoom. This one, and
    * any implementation that cannot tell, only translates.
    */
   public void glTranslateToMapPoint(double x, double y) {
      this.glTranslated(x, y, 0.0);
   }

   /**
    * Starts drawing vertices relative to the projected point (x, y): pushes the modelview, translates it there with
    * {@link #glTranslateToMapPoint} and makes renderPolygon subtract the point from the vertices it projects. Every call
    * needs an {@link #endVertexOrigin}.
    */
   public void beginVertexOrigin(double x, double y) {
      if (this.vertexOriginCount * 2 == this.vertexOrigins.length) {
         this.vertexOrigins = Arrays.copyOf(this.vertexOrigins, this.vertexOrigins.length * 2);
      }

      this.vertexOrigins[this.vertexOriginCount * 2] = this.vertexOriginX;
      this.vertexOrigins[this.vertexOriginCount * 2 + 1] = this.vertexOriginY;
      ++this.vertexOriginCount;
      this.glPushMatrix();
      this.glTranslateToMapPoint(x - this.vertexOriginX, y - this.vertexOriginY);
      this.vertexOriginX = x;
      this.vertexOriginY = y;
   }

   public void endVertexOrigin() {
      this.glPopMatrix();
      --this.vertexOriginCount;
      this.vertexOriginX = this.vertexOrigins[this.vertexOriginCount * 2];
      this.vertexOriginY = this.vertexOrigins[this.vertexOriginCount * 2 + 1];
   }

   /** The projected point vertices are drawn relative to, 0 outside beginVertexOrigin and endVertexOrigin. */
   public double getVertexOriginX() {
      return this.vertexOriginX;
   }

   public double getVertexOriginY() {
      return this.vertexOriginY;
   }
```

---

## 2. `tr/com/havelsan/tmap/impl/view/gpu/TGLDesktopJOGL2.java`

Import: `import java.util.BitSet;` (`GL2`, `LOGGER` zaten var.)

Bu dosya modelview'in double kopyasını ("ayna") tutuyor:
- **Başlangıç:** 2D'de kamera kurulurken (`glTranslateCamera`). 3D'de `begin3D` … `end3D` arasındaki `glLoadIdentity`.
- **Takip:** Ayna, wrapper'dan geçen push, pop, translate, scale, rotate ve gluLookAt çağrılarını double olarak tekrarlıyor.
- **Hassas öteleme:** `glTranslateToMapPoint` (3D'de `glTranslateToGlobePoint`, adım 8) aynayı öteleyip `glLoadMatrixd` ile yüklüyor.

### 2a. Alanlar (diğer alanların yanına)

```java
   private static final boolean VERIFY_MAP_POINT_TRANSLATION = Boolean.getBoolean("tmap.verifyMapPointTranslation");
   private boolean mirrorOn = false;
   private boolean modelviewMode = true;
   private boolean in3D = false;
   private int mirrorLevel = 0;
   private final double[] mirror = new double[16 * 64];
   private final boolean[] mirrorExact = new boolean[64];
   private final double[] mirrorProduct = new double[16];
   private final double[] lookAtMatrix = new double[16];
   private final double[] rotation3D = new double[16];
   private final int[] matrixModeQuery = new int[1];
   private boolean compilingList = false;
   private int compiledList;
   private int compileLevel;
   private boolean compileMovesMatrix;
   private boolean compileChangesMatrixMode;
   private final BitSet listsMovingMatrix = new BitSet();
   private final BitSet listsChangingMatrixMode = new BitSet();
   private long preciseTranslations;
   private long plainTranslations;
   private long verifyMismatches;
   private long translationReports;
```

### 2b. Yeni metotlar (örneğin `glPushMatrix()`'in hemen üstüne)

```java
   /**
    * Applies the map centre translation and starts the modelview mirror from it: the matrix the translation is applied to
    * is read back once, the translation itself goes through glTranslated and so into the mirror in double precision.
    */
   @Override
   public void glTranslateCamera(double x, double y, double z) {
      if (this.curDLC == null && !this.compilingList) {
         this.gl.glGetIntegerv(GL2.GL_MATRIX_MODE, this.matrixModeQuery, 0);
         this.modelviewMode = this.matrixModeQuery[0] == GL2.GL_MODELVIEW;
         if (this.modelviewMode) {
            this.mirrorLevel = 0;
            this.gl.glGetDoublev(GL2.GL_MODELVIEW_MATRIX, this.mirror, 0);
            this.mirrorExact[0] = true;
            this.mirrorOn = true;
         }
      }

      this.glTranslated(x, y, z);
      this.reportTranslations();
   }

   @Override
   public void glTranslateToMapPoint(double x, double y) {
      this.translatePrecisely(x, y, 0.0);
   }

   /**
    * glTranslated with the result computed in double precision. The GL keeps its matrices in single precision, which at
    * the map's coordinates (projected 30-45 in 2D, Map3D's 5 unit earth radius in 3D) rounds positions to about 0.4 m.
    * The wrapper mirrors the modelview in double precision instead (see the track methods): from glTranslateCamera in
    * 2D, from glLoadIdentity between begin3D and end3D, through its own push, pop, translate, scale, rotate and gluLookAt.
    * Here the mirror is translated and loaded, so vertices given relative to the point keep their precision. Anything the
    * mirror cannot follow (a display list that moves the matrix, glOrtho or glFrustum on the modelview, a list being
    * compiled) makes it a plain glTranslated, which still draws the shape itself precisely.
    */
   private void translatePrecisely(double x, double y, double z) {
      if (this.mirrorOn && this.modelviewMode && !this.compilingList && this.curDLC == null && this.mirrorExact[this.mirrorLevel]
            && (!VERIFY_MAP_POINT_TRANSLATION || this.verifyMirror())) {
         this.checkForGLError("Method begin");
         this.mirrorTranslate(x, y, z);
         this.gl.glLoadMatrixd(this.mirror, this.mirrorLevel * 16);
         ++this.preciseTranslations;
         this.checkForGLError("Method end");
      } else {
         ++this.plainTranslations;
         this.glTranslated(x, y, z);
      }
   }

   private void trackPushMatrix() {
      if (this.compilingList) {
         ++this.compileLevel;
      } else if (this.mirrorOn && this.modelviewMode) {
         if (this.mirrorLevel + 1 == this.mirrorExact.length) {
            this.mirrorOn = false;
         } else {
            System.arraycopy(this.mirror, this.mirrorLevel * 16, this.mirror, (this.mirrorLevel + 1) * 16, 16);
            this.mirrorExact[this.mirrorLevel + 1] = this.mirrorExact[this.mirrorLevel];
            ++this.mirrorLevel;
         }
      }
   }

   private void trackPopMatrix() {
      if (this.compilingList) {
         if (--this.compileLevel < 0) {
            this.compileMovesMatrix = true;
         }
      } else if (this.mirrorOn && this.modelviewMode) {
         if (this.mirrorLevel == 0) {
            this.mirrorOn = false;
         } else {
            --this.mirrorLevel;
         }
      }
   }

   private void trackTranslated(double x, double y, double z) {
      if (this.compilingList) {
         if (this.compileLevel <= 0) {
            this.compileMovesMatrix = true;
         }
      } else if (this.mirrorOn && this.modelviewMode) {
         this.mirrorTranslate(x, y, z);
      }
   }

   private void trackScaled(double x, double y, double z) {
      if (this.compilingList) {
         if (this.compileLevel <= 0 && (x != 1.0 || y != 1.0 || z != 1.0)) {
            this.compileMovesMatrix = true;
         }
      } else if (this.mirrorOn && this.modelviewMode) {
         int o = this.mirrorLevel * 16;
         for (int r = 0; r < 4; ++r) {
            this.mirror[o + r] *= x;
            this.mirror[o + 4 + r] *= y;
            this.mirror[o + 8 + r] *= z;
         }
      }
   }

   /** mirror = mirror x m (column major, like the GL's); m == null: a change the mirror does not know. */
   private void trackMultiply(double[] m) {
      if (this.compilingList) {
         if (this.compileLevel <= 0) {
            this.compileMovesMatrix = true;
         }
      } else if (this.mirrorOn && this.modelviewMode) {
         if (m == null) {
            this.mirrorExact[this.mirrorLevel] = false;
         } else {
            int o = this.mirrorLevel * 16;
            double[] g = this.mirror;
            double[] p = this.mirrorProduct;
            for (int c = 0; c < 4; ++c) {
               for (int r = 0; r < 4; ++r) {
                  p[c * 4 + r] = g[o + r] * m[c * 4] + g[o + 4 + r] * m[c * 4 + 1] + g[o + 8 + r] * m[c * 4 + 2] + g[o + 12 + r] * m[c * 4 + 3];
               }
            }
            System.arraycopy(p, 0, g, o, 16);
         }
      }
   }

   /** glLoadIdentity: the mirror knows the result; between begin3D and end3D (Map3D's camera) it also starts here. */
   private void trackLoadIdentity() {
      if (this.compilingList) {
         if (this.compileLevel <= 0) {
            this.compileMovesMatrix = true;
         }
      } else if (this.modelviewMode && (this.mirrorOn || this.in3D)) {
         if (!this.mirrorOn) {
            this.mirrorOn = true;
            this.mirrorLevel = 0;
         }

         int o = this.mirrorLevel * 16;
         for (int k = 0; k < 16; ++k) {
            this.mirror[o + k] = k % 5 == 0 ? 1.0 : 0.0;
         }
         this.mirrorExact[this.mirrorLevel] = true;
      }
   }

   private void trackMatrixMode(int mode) {
      if (this.compilingList) {
         this.compileChangesMatrixMode = true;
      } else {
         this.modelviewMode = mode == GL2.GL_MODELVIEW;
      }
   }

   private void trackCallList(int list) {
      if (this.compilingList) {
         if (this.listsChangingMatrixMode.get(list)) {
            this.compileChangesMatrixMode = true;
         }
         if (this.listsMovingMatrix.get(list) && this.compileLevel <= 0) {
            this.compileMovesMatrix = true;
         }
      } else if (this.listsChangingMatrixMode.get(list)) {
         this.mirrorOn = false;
      } else if (this.listsMovingMatrix.get(list)) {
         this.trackMultiply(null);
      }
   }

   /** mirror = mirror x translation(x, y, z) */
   private void mirrorTranslate(double x, double y, double z) {
      int o = this.mirrorLevel * 16;
      double[] g = this.mirror;
      for (int r = 0; r < 4; ++r) {
         g[o + 12 + r] += g[o + r] * x + g[o + 4 + r] * y + g[o + 8 + r] * z;
      }
   }

   /**
    * glRotated's matrix (angle in degrees about the normalised axis) in double, column major; false for a zero axis.
    * The GL's own glRotated works in single precision (and one NVIDIA driver's is off by 1.4e-5 for Map3D's axis of
    * length 5), which in 3D moves the camera tens of metres at close zoom; between begin3D and end3D glRotated loads this
    * matrix instead.
    */
   private boolean rotationMatrix(double angle, double x, double y, double z, double[] m) {
      double length = Math.sqrt(x * x + y * y + z * z);
      if (!(length > 0.0)) {
         return false;
      }

      x /= length;
      y /= length;
      z /= length;
      double c = Math.cos(Math.toRadians(angle));
      double s = Math.sin(Math.toRadians(angle));
      double t = 1.0 - c;
      m[0] = x * x * t + c;
      m[1] = y * x * t + z * s;
      m[2] = x * z * t - y * s;
      m[3] = 0.0;
      m[4] = x * y * t - z * s;
      m[5] = y * y * t + c;
      m[6] = y * z * t + x * s;
      m[7] = 0.0;
      m[8] = x * z * t + y * s;
      m[9] = y * z * t - x * s;
      m[10] = z * z * t + c;
      m[11] = 0.0;
      m[12] = 0.0;
      m[13] = 0.0;
      m[14] = 0.0;
      m[15] = 1.0;
      return true;
   }

   /**
    * Compares the mirror with the GL's modelview (tmap.verifyMapPointTranslation=true only) and stops the mirror if they
    * differ. The GL's single precision matrix is itself off by rounding, so this only catches a matrix call the mirror
    * missed.
    */
   private boolean verifyMirror() {
      double[] actual = new double[16];
      this.gl.glGetDoublev(GL2.GL_MODELVIEW_MATRIX, actual, 0);
      int o = this.mirrorLevel * 16;
      double size = 0.0;
      for (int i = 0; i < 16; ++i) {
         size = Math.max(size, Math.abs(this.mirror[o + i]));
      }

      double tolerance = 16.0 * Math.ulp((float) size);
      for (int i = 0; i < 16; ++i) {
         if (Math.abs(actual[i] - this.mirror[o + i]) > tolerance) {
            if (++this.verifyMismatches <= 20L) {
               LOGGER.warn("Mirrored modelview differs from the GL's at entry {} (level {}): {} instead of {}", i, this.mirrorLevel, this.mirror[o + i], actual[i]);
            }
            this.mirrorOn = false;
            return false;
         }
      }
      return true;
   }

   private void reportTranslations() {
      if (VERIFY_MAP_POINT_TRANSLATION && ++this.translationReports % 200L == 0L) {
         LOGGER.info("Map point translations: {} precise, {} plain, {} verification mismatches", this.preciseTranslations, this.plainTranslations, this.verifyMismatches);
      }
   }
```

### 2c. Mevcut wrapper metotlarına tek satırlık eklemeler

Hepsi, metodun **gerçekten GL'i çağırdığı satırın hemen altına** eklenir. Bu satır, `emulateDisplayLists`/`command(...)` kontrolünün içindeki `this.gl.glXxx(...)` satırıdır.

| Metot | Aranacak satır | Altına eklenecek |
|---|---|---|
| `glPushMatrix()` | `this.gl.glPushMatrix();` | `this.trackPushMatrix();` |
| `glPopMatrix()` | `this.gl.glPopMatrix();` | `this.trackPopMatrix();` |
| `glTranslated(x, y, z)` | `this.gl.glTranslated(...)` | `this.trackTranslated(x, y, z);` (aynı parametreler) |
| `glScaled(x, y, z)` | `this.gl.glScaled(...)` | `this.trackScaled(x, y, z);` (aynı parametreler) |
| `glMatrixMode(mode)` | `this.gl.glMatrixMode(...)` | `this.trackMatrixMode(mode);` |
| `glLoadIdentity()` | `this.gl.glLoadIdentity();` | `this.trackLoadIdentity();` |
| `glOrtho(...)` | `this.gl.glOrtho(...)` | `this.trackMultiply(null);` |
| `glFrustum(...)` | `this.gl.glFrustum(...)` | `this.trackMultiply(null);` |
| `gluPickMatrix(...)` | `glu.gluPickMatrix(...)` | `this.trackMultiply(null);` |
| `glRotated(...)` | Gövde değişiyor, bkz. **2e** | |
| `gluLookAt(...)` | Metodun tamamı değişiyor, bkz. **2f** | |
| `begin3D()`, `end3D()` | Bkz. **2g** | |

Display list metotları. Hepsinde ekleme `if (!this.emulateDisplayLists)` dalının içine yapılır:

```java
   // glNewList(int glIndex): "this.gl.glNewList(glIndex, GL2.GL_COMPILE)" ve "useArrays = false" satırlarının altına
         this.compilingList = true;
         this.compiledList = glIndex;
         this.compileLevel = 0;
         this.compileMovesMatrix = false;
         this.compileChangesMatrixMode = false;

   // glEndList(): "this.gl.glEndList()" ve "useArrays = true" satırlarının altına
         if (this.compilingList && this.compiledList >= 0) {
            this.listsMovingMatrix.set(this.compiledList, this.compileMovesMatrix);
            this.listsChangingMatrixMode.set(this.compiledList, this.compileChangesMatrixMode);
         }
         this.compilingList = false;

   // glDeleteLists(int glIndex): "this.gl.glDeleteLists(glIndex, 1)" satırının altına
         if (glIndex >= 0) {
            this.listsMovingMatrix.clear(glIndex);
            this.listsChangingMatrixMode.clear(glIndex);
         }

   // glCallList(int list): "this.gl.glCallList(list)" satırının altına
         if (list >= 0) {
            this.trackCallList(list);
         }
```

### 2d. Poligon vertex'lerinden orijini çıkarma (2 yer)

`renderPolygon(...)` içinde, `projection.isLatLonVisible(lambda, phi)` dalında:
```java
// önce
this.gl.glVertex3d(aPos1[1], aPos1[0], -minDepth * 2.0);
// sonra
this.gl.glVertex3d(aPos1[1] - this.getVertexOriginX(), aPos1[0] - this.getVertexOriginY(), -minDepth * 2.0);
```

İç sınıf `LargeTessellatorCallback2D.vertex(Object)` içinde:
```java
// önce
this.vertices.add(aPos1[1], aPos1[0], -this.minDepth * 2.0);
// sonra
this.vertices.add(aPos1[1] - this.gl1.getVertexOriginX(), aPos1[0] - this.gl1.getVertexOriginY(), -this.minDepth * 2.0);
```
(Ekran grafikleri / `noProjection` dalları değişmez; 3D vertex'leri adım 8'de.)

### 2e. `glRotated(angle, x, y, z)`: 3D'de double

Bu makinedeki NVIDIA sürücüsünün `glRotated`'ı, Map3D'nin bakış ekseni etrafındaki dönüşünde 1.4e-5 hata yapıyor. Göz, dünya yarıçapının 1e-5'i kadar yukarıda olduğu için bu hata kamerayı yaklaşık 90 m geri itiyordu: 91 m'lik görünümde her şey 2.6 kat küçük çiziliyordu. 2D'de eskisi gibi `glRotated` çağrılıyor; ayna dönüşü double olarak uyguluyor.

`emulateDisplayLists`/`command(...)` kontrolünün içindeki gövde:

```java
// önce
         this.gl.glRotated(angle, x, y, z);
// sonra
         boolean known = this.rotationMatrix(angle, x, y, z, this.rotation3D);
         if (known && this.in3D) {
            this.gl.glMultMatrixd(this.rotation3D, 0);
         } else {
            this.gl.glRotated(angle, x, y, z);
         }

         if (angle != 0.0) {
            this.trackMultiply(known ? this.rotation3D : null);
         }
```

### 2f. `gluLookAt(...)`: double ile hesaplama (3D'de yakın zoom'da siyah ekran)

JOGL'ün `gluLookAt`'i float ile çalışır ve 3.5e-4'ten kısa bir bakış yönünü sıfırlar (`VectorUtil.normalizeVec3`). Map3D'de dünya yarıçapı 5 birim olduğu için göz mesafesi yaklaşık 440 m'nin altına inince kamera matrisi çöker ve 3D globe siyah görünür. Orijinal jar'da da böyle: 200 m'de bile göz mesafesi 127 m.

Metodun tamamı:
```java
   public void gluLookAt(double d, double e, double f, double g, double h, double i, double upX, double upY, double upZ) {
      // JOGL's gluLookAt works in float and zeroes a view direction shorter than about 3.5e-4, which Map3D's
      // camera (5 units per earth radius) is under below about 440 m: the 3D view went black. Built in double here.
      double fx = g - d;
      double fy = h - e;
      double fz = i - f;
      double fLength = Math.sqrt(fx * fx + fy * fy + fz * fz);
      double sx = fy * upZ - fz * upY;
      double sy = fz * upX - fx * upZ;
      double sz = fx * upY - fy * upX;
      double sLength = Math.sqrt(sx * sx + sy * sy + sz * sz);
      if (!(fLength > 0.0) || !(sLength > 0.0)) {
         glu.gluLookAt(d, e, f, g, h, i, upX, upY, upZ);
         this.trackMultiply(null);
         return;
      }

      fx /= fLength;
      fy /= fLength;
      fz /= fLength;
      sx /= sLength;
      sy /= sLength;
      sz /= sLength;
      double ux = sy * fz - sz * fy;
      double uy = sz * fx - sx * fz;
      double uz = sx * fy - sy * fx;
      double[] m = this.lookAtMatrix;
      m[0] = sx;
      m[1] = ux;
      m[2] = -fx;
      m[3] = 0.0;
      m[4] = sy;
      m[5] = uy;
      m[6] = -fy;
      m[7] = 0.0;
      m[8] = sz;
      m[9] = uz;
      m[10] = -fz;
      m[11] = 0.0;
      m[12] = -(sx * d + sy * e + sz * f);
      m[13] = -(ux * d + uy * e + uz * f);
      m[14] = fx * d + fy * e + fz * f;
      m[15] = 1.0;
      this.gl.glMultMatrixd(m, 0);
      this.trackMultiply(m);
   }
```

### 2g. `begin3D()` ve `end3D()`

```java
   public void begin3D() {
      this.in3D = true;
      // ... mevcut glEnable satırları aynen
   }

   public void end3D() {
      // ... mevcut glDisable satırları aynen
      this.in3D = false;
      this.reportTranslations();
   }
```

---

## 3. `tr/com/havelsan/tmap/impl/shape/graphic/renderer/ARendererGraphic.java`

### 3a. Rendering property anahtarı (`DISPLAY_LIST_SELECTION = 13000` satırının altına)
```java
   public static final Integer LocalOrigin = 14000;
```

### 3b. `pglTranslated(double longitude, double latitude, double depth)`: ekran grafiği olmayan dal
```java
// önce
this.gl.glTranslated(aPos1[1], aPos1[0], 0.0);
// sonra
this.gl.glTranslateToMapPoint(aPos1[1] - this.gl.getVertexOriginX(), aPos1[0] - this.gl.getVertexOriginY());
```

### 3c. `pglVertex2d(double longitude, double latitude, double depth, GISVertexBuilder vertices)`: projeksiyonlu dal
```java
// önce
vertices.add(aPos1[1], aPos1[0], depth);
// sonra
vertices.add(aPos1[1] - this.gl.getVertexOriginX(), aPos1[0] - this.gl.getVertexOriginY(), depth);
```

### 3d. Yeni metotlar ve iç sınıf (sınıfın herhangi bir yerine)
```java
   /**
    * Makes this graphic's projected vertices relative to its first rendering point until endLocalOrigin. Absolute
    * projected coordinates are around 30-45 in Turkey, where single precision floats step every 0.4 m or so, which bends
    * lines and circles at close zoom; relative to a point on the graphic they stay small and keep their precision, and
    * AGISGL.beginVertexOrigin puts the point back into the modelview in double precision. pglVertex2d, pglTranslated
    * and the GL's renderPolygon subtract the point. The point is kept per rendering point array, which is replaced
    * whenever the graphic's display lists are. A projection change (another projection, or a centre based one such as
    * Cassini following the map) keeps the array but clears the display lists, so the point is also projected again
    * when the projection, its centre or the longitude offset differ and the display lists are gone. Either way a display
    * list is always drawn with the point it was compiled with.
    * Returns whether a point was set; pass the result to endLocalOrigin.
    */
   protected boolean beginLocalOrigin(GISPosition[] points) {
      if (!this.isScreenGraphic() && points != null) {
         LocalOriginOfPoints origin = (LocalOriginOfPoints) this.graphic.getRenderingProperty(LocalOrigin);
         if (origin == null || origin.points != points
               || !origin.isFor(this.projection, this.longitudeOffset)
                  && this.graphic.getRenderingProperty(DisplayList) == null
                  && this.graphic.getRenderingProperty(DisplayList2) == null) {
            origin = new LocalOriginOfPoints(points, this.projection, this.longitudeOffset);
            this.graphic.putRenderingProperty(LocalOrigin, origin);
         }
         if (origin.valid) {
            this.gl.beginVertexOrigin(origin.x, origin.y);
            return true;
         }
      }
      return false;
   }

   protected void endLocalOrigin(boolean begun) {
      if (begun) {
         this.gl.endVertexOrigin();
      }
   }

   private static final class LocalOriginOfPoints {
      final GISPosition[] points;
      final boolean valid;
      final double x;
      final double y;
      private final IGISSimpleProjection projection;
      private final double centerLat;
      private final double centerLon;
      private final double longitudeOffset;

      LocalOriginOfPoints(GISPosition[] points, IGISSimpleProjection projection, double longitudeOffset) {
         this.points = points;
         this.projection = projection;
         this.centerLat = centerCoordinate(projection, 0);
         this.centerLon = centerCoordinate(projection, 1);
         this.longitudeOffset = longitudeOffset;
         double[] projected = null;
         for (GISPosition point : points) {
            if (point != null) {
               projected = projection.getProjectedLatLon(point.getY(), point.getX() + longitudeOffset);
               break;
            }
         }
         this.valid = projected != null && Double.isFinite(projected[0]) && Double.isFinite(projected[1]);
         this.x = this.valid ? projected[1] : 0.0;
         this.y = this.valid ? projected[0] : 0.0;
      }

      /** Whether the point was projected with this projection, at its current centre, with this longitude offset. */
      boolean isFor(IGISSimpleProjection projection, double longitudeOffset) {
         return projection == this.projection && longitudeOffset == this.longitudeOffset
               && centerCoordinate(projection, 0) == this.centerLat && centerCoordinate(projection, 1) == this.centerLon;
      }

      private static double centerCoordinate(IGISSimpleProjection projection, int index) {
         double[] center = projection.getProjectionCenter();
         return center != null ? center[index] : 0.0;
      }
   }
```
- `projection`, `preRender`'da atanan private `IGISSimpleProjection` alanıdır; `longitudeOffset` mevcut protected alandır. `DisplayList` ve `DisplayList2` sınıftaki mevcut rendering property anahtarlarıdır.
- **Neden projeksiyon kontrolü:** Projeksiyon değişince (başka projeksiyon seçilince ya da Cassini gibi merkez tabanlı bir projeksiyonun merkezi haritayı izleyip kayınca) `Map2D.projectionChanged` display list'leri siler ama grafiğin nokta dizisini yenilemez. Bu kontrol olmazsa orijin eski projeksiyonda kalır, yeni projeksiyondaki vertex'ler ondan uzaktır ve hassasiyet kaybolur (Cassini'de orijinal jar'dan bile kötü).
- **Neden display list kontrolü:** Orijin yalnızca grafiğin display list'leri silinmişse, yani yeniden derlenecekse yenilenir. Böylece bir liste hiçbir zaman derlendiği orijinden başkasıyla çizilmez.

---

## 4. `.../renderer/GLRendererGraphicLineString.java`

### 4a. `render(AGISGL, IGISGraphic, boolean)`
`points = graphic1.getPointsForRendering();` satırından sonraki `if (points != null && points.length >= 2) { ... }` bloğunun **içindeki her şeyi** (`drawArrows` dahil) try/finally içine alın:

```java
      points = graphic1.getPointsForRendering();
      if (points != null && points.length >= 2) {
         boolean localOrigin = this.beginLocalOrigin(points);
         try {
            // ... bloğun mevcut içeriği aynen (renderSymbolizedLines, getGlIndex, display list, drawArrows) ...
         } finally {
            this.endLocalOrigin(localOrigin);
         }
      }
```

### 4b. `pglVertex2d(...)`: `pathType == GISGeodesy.LINEAR` dalı
```java
// önce
vertices.add(aPos1[1], aPos1[0]);
// sonra
vertices.add(aPos1[1] - this.gl.getVertexOriginX(), aPos1[0] - this.gl.getVertexOriginY());
```

---

## 5. `.../renderer/GLRendererGraphicPolygon.java`

### 5a. `render(AGISGL, IGISGraphic, boolean)`
```java
   public void render(AGISGL gl1, IGISGraphic agraphic, boolean selectionModeRendering) {
      this.preRender(gl1, agraphic, selectionModeRendering);
      boolean localOrigin = this.beginLocalOrigin(((IGISGraphicPolygon) this.graphic).getPointsForRendering());
      try {
         this.renderPolygon(selectionModeRendering, false);
      } finally {
         this.endLocalOrigin(localOrigin);
      }
   }
```

### 5b. `pglVertex2d(...)`: `getPathType() == GISGeodesy.LINEAR` dalı
```java
// önce
vertices.add(aPos1[1], aPos1[0]);
// sonra
vertices.add(aPos1[1] - this.gl.getVertexOriginX(), aPos1[0] - this.gl.getVertexOriginY());
```

(`render3D` metotlarına dokunulmaz.)

---

## 6. `tr/com/havelsan/tmap/impl/view/Map2D.java`

`makeLatLonTranslation()`:
```java
// önce
this.gl.glTranslated(-latlon[1], -latlon[0], 0.0);
// sonra
this.gl.glTranslateCamera(-latlon[1], -latlon[0], 0.0);
```

`setMinScaleInKm(double)`: alt sınır `0.2` → `0.05`:
```java
      if (!(minScaleIn < 0.05)) {   // eskiden 0.2
```

---

## 3D eki: Map3D'de yakın zoom'da hassas çizim (7 → 11)

1–6 uygulandıysa bunlar yalnızca ek. Aynı dosyalardan beşine dokunuyor; `Map3D` ve `Map2D` değişmiyor. 2D davranışı değişmez: eklenen her şey ya yalnızca `begin3D` … `end3D` arasında çalışıyor ya da 3D orijini yokken 0 çıkarıyor.

Ne yapıyor:

- 3D'de vertex'ler yarıçapı 1 olan bir küre üzerinde (`pglVertex3d`). Float'ta bu yaklaşık 0.4 m'lik adımlar demek. Çizgi ve poligonlar artık vertex'lerini kendi ilk noktalarına göre yazıyor (2D'deki gibi).
- Adım 2'deki ayna 3D'de `glLoadIdentity`'den itibaren çalışıyor. Her grafik için "kamera × öteleme(ilk nokta)" double hesaplanıyor ve `glLoadMatrixd` ile yükleniyor (`glTranslateToGlobePoint`, adım 8a).
- 3D kamera düzeltmeleri (`glRotated`, `gluLookAt`) de adım 2'de (2e, 2f).

---

## 7. `AGISGL.java`

Alanlar (1. adımdaki `vertexOriginY` alanının altına):

```java
   private double[] vertexOrigins3D = new double[24];
   private int vertexOrigin3DCount = 0;
   private double vertexOrigin3DX = 0.0;
   private double vertexOrigin3DY = 0.0;
   private double vertexOrigin3DZ = 0.0;
```

Metotlar (1. adımdaki `getVertexOriginY()`'nin altına):

```java
   /**
    * 3D counterpart of {@link #glTranslateToMapPoint}: translates the modelview by (x, y, z) in the globe's model
    * coordinates (Map3D: earth radius 1). An implementation that follows the 3D modelview in double precision loads the
    * translated matrix, so vertices given relative to the point keep their precision; this one only translates.
    */
   public void glTranslateToGlobePoint(double x, double y, double z) {
      this.glTranslated(x, y, z);
   }

   /**
    * 3D counterpart of {@link #beginVertexOrigin}: pushes the modelview, translates it to the globe point (x, y, z) with
    * {@link #glTranslateToGlobePoint} and makes the 3D vertex code subtract the point. Every call needs an
    * {@link #endVertexOrigin3D}.
    */
   public void beginVertexOrigin3D(double x, double y, double z) {
      if (this.vertexOrigin3DCount * 3 == this.vertexOrigins3D.length) {
         this.vertexOrigins3D = Arrays.copyOf(this.vertexOrigins3D, this.vertexOrigins3D.length * 2);
      }

      this.vertexOrigins3D[this.vertexOrigin3DCount * 3] = this.vertexOrigin3DX;
      this.vertexOrigins3D[this.vertexOrigin3DCount * 3 + 1] = this.vertexOrigin3DY;
      this.vertexOrigins3D[this.vertexOrigin3DCount * 3 + 2] = this.vertexOrigin3DZ;
      ++this.vertexOrigin3DCount;
      this.glPushMatrix();
      this.glTranslateToGlobePoint(x - this.vertexOrigin3DX, y - this.vertexOrigin3DY, z - this.vertexOrigin3DZ);
      this.vertexOrigin3DX = x;
      this.vertexOrigin3DY = y;
      this.vertexOrigin3DZ = z;
   }

   public void endVertexOrigin3D() {
      this.glPopMatrix();
      --this.vertexOrigin3DCount;
      this.vertexOrigin3DX = this.vertexOrigins3D[this.vertexOrigin3DCount * 3];
      this.vertexOrigin3DY = this.vertexOrigins3D[this.vertexOrigin3DCount * 3 + 1];
      this.vertexOrigin3DZ = this.vertexOrigins3D[this.vertexOrigin3DCount * 3 + 2];
   }

   /** The globe point 3D vertices are drawn relative to, 0 outside beginVertexOrigin3D and endVertexOrigin3D. */
   public double getVertexOrigin3DX() {
      return this.vertexOrigin3DX;
   }

   public double getVertexOrigin3DY() {
      return this.vertexOrigin3DY;
   }

   public double getVertexOrigin3DZ() {
      return this.vertexOrigin3DZ;
   }
```

---

## 8. `TGLDesktopJOGL2.java`

Ayna ve 3D kamera (`glRotated`, `gluLookAt`, `begin3D`/`end3D`) adım 2'de. Burada 3D'ye özel iki şey kalıyor.

### 8a. `glTranslateToGlobePoint` (2b'deki `glTranslateToMapPoint`'in altına)

```java
   @Override
   public void glTranslateToGlobePoint(double x, double y, double z) {
      this.translatePrecisely(x, y, z);
   }
```

### 8b. 3D vertex'lerinden orijini çıkarma (3 yer)

`renderPolygon(...)` içinde, `glBegin` ile çizilen dalda `else if (is3d)`:
```java
// önce
this.gl.glVertex3d(Math.cos(lambda) * Math.cos(phi) * (1.0 + altitude * heightScale / 6371.0 / 1000.0), Math.cos(lambda) * Math.sin(phi) * (1.0 + altitude * heightScale / 6371.0 / 1000.0), Math.sin(lambda) * (1.0 + altitude * heightScale / 6371.0 / 1000.0));
// sonra
this.gl.glVertex3d(Math.cos(lambda) * Math.cos(phi) * (1.0 + altitude * heightScale / 6371.0 / 1000.0) - this.getVertexOrigin3DX(), Math.cos(lambda) * Math.sin(phi) * (1.0 + altitude * heightScale / 6371.0 / 1000.0) - this.getVertexOrigin3DY(), Math.sin(lambda) * (1.0 + altitude * heightScale / 6371.0 / 1000.0) - this.getVertexOrigin3DZ());
```

`renderPolygon(...)` içinde, tessellator'dan önceki `glPushMatrix`'in altındaki 3D dalı (`glScaled(scaleFactor, ...)`'in **üstüne** bir satır):
```java
         } else {
            double scaleFactor = 1.0 - minDepth3D;
            // the scale lowers the polygon towards the globe's centre; with vertices relative to a 3D vertex origin the
            // origin has to be lowered as well (0 without one)
            this.gl.glTranslated(-minDepth3D * this.getVertexOrigin3DX(), -minDepth3D * this.getVertexOrigin3DY(), -minDepth3D * this.getVertexOrigin3DZ());
            this.gl.glScaled(scaleFactor, scaleFactor, scaleFactor);
         }
```
(Buradaki `this.gl` ham `GL2`; bu satır wrapper'ı atlar, `glPushMatrix`/`glPopMatrix` arasında kaldığı için izlemeye etkisi yok.)

İç sınıf `LargeTessellatorCallback3D.drawVertex3d(...)`:
```java
// önce
this.vertices.add(Math.cos(longitude) * Math.cos(latitude) * (1.0 + altitude * heightScale / 6371.0 / 1000.0), Math.cos(longitude) * Math.sin(latitude) * (1.0 + altitude * heightScale / 6371.0 / 1000.0), Math.sin(longitude) * (1.0 + altitude * heightScale / 6371.0 / 1000.0));
// sonra
this.vertices.add(Math.cos(longitude) * Math.cos(latitude) * (1.0 + altitude * heightScale / 6371.0 / 1000.0) - this.gl1.getVertexOrigin3DX(), Math.cos(longitude) * Math.sin(latitude) * (1.0 + altitude * heightScale / 6371.0 / 1000.0) - this.gl1.getVertexOrigin3DY(), Math.sin(longitude) * (1.0 + altitude * heightScale / 6371.0 / 1000.0) - this.gl1.getVertexOrigin3DZ());
```

---

## 9. `ARendererGraphic.java`

### 9a. `pglTranslated3D(...)`: metodun başına

```java
   protected void pglTranslated3D(double longitude, double latitude, double altitude) {
      // the rotations below turn about the globe's centre: back there from a 3D vertex origin first
      double originX = this.gl.getVertexOrigin3DX();
      double originY = this.gl.getVertexOrigin3DY();
      double originZ = this.gl.getVertexOrigin3DZ();
      if (originX != 0.0 || originY != 0.0 || originZ != 0.0) {
         this.gl.glTranslated(-originX, -originY, -originZ);
      }

      // ... mevcut glRotated / glTranslated satırları aynen
```

### 9b. `pglVertex3d(double longitude, double latitude, double depth, GISVertexBuilder vertices, boolean useHeightScale)`

```java
// önce
vertices.add(Math.cos(lambda) * Math.cos(phi) * (1.0 + depth * heightScale), Math.cos(lambda) * Math.sin(phi) * (1.0 + depth * heightScale), Math.sin(lambda) * (1.0 + depth * heightScale));
// sonra
vertices.add(Math.cos(lambda) * Math.cos(phi) * (1.0 + depth * heightScale) - this.gl.getVertexOrigin3DX(), Math.cos(lambda) * Math.sin(phi) * (1.0 + depth * heightScale) - this.gl.getVertexOrigin3DY(), Math.sin(lambda) * (1.0 + depth * heightScale) - this.gl.getVertexOrigin3DZ());
```

### 9c. Yeni metotlar ve iç sınıf (3d'deki `endLocalOrigin`'in altına)

Rendering property anahtarı olarak `LocalOrigin + ExtensionFor3D` (14099) kullanılıyor; yeni sabit gerekmiyor.

```java
   /**
    * 3D counterpart of beginLocalOrigin: makes this graphic's globe vertices (pglVertex3d, the GL's 3D renderPolygon)
    * relative to its first rendering point on the globe until endLocalOrigin3D. Map3D's vertices are on a globe of
    * radius 1, where single precision floats step every 0.4 m or so; relative to a point on the graphic they keep their
    * precision, and AGISGL.beginVertexOrigin3D puts the point back into the modelview in double precision. The point is
    * kept per rendering point array like the 2D one, so a display list is always drawn with the point it was compiled
    * with. Returns whether a point was set; pass the result to endLocalOrigin3D.
    */
   protected boolean beginLocalOrigin3D(GISPosition[] points) {
      if (!this.isScreenGraphic() && points != null) {
         GlobeOriginOfPoints origin = (GlobeOriginOfPoints) this.graphic.getRenderingProperty(LocalOrigin + ExtensionFor3D);
         if (origin == null || origin.points != points) {
            origin = new GlobeOriginOfPoints(points, this.refMap3DLon(), this.refMap3DLat());
            this.graphic.putRenderingProperty(LocalOrigin + ExtensionFor3D, origin);
         }
         if (origin.valid) {
            this.gl.beginVertexOrigin3D(origin.x, origin.y, origin.z);
            return true;
         }
      }
      return false;
   }

   protected void endLocalOrigin3D(boolean begun) {
      if (begun) {
         this.gl.endVertexOrigin3D();
      }
   }

   /** The first point of a rendering point array on Map3D's globe of radius 1, as pglVertex3d puts it at depth 0. */
   private static final class GlobeOriginOfPoints {
      final GISPosition[] points;
      final boolean valid;
      final double x;
      final double y;
      final double z;

      GlobeOriginOfPoints(GISPosition[] points, double refMap3DLon, double refMap3DLat) {
         this.points = points;
         GISPosition first = null;
         for (GISPosition point : points) {
            if (point != null) {
               first = point;
               break;
            }
         }

         this.valid = first != null && Double.isFinite(first.getX()) && Double.isFinite(first.getY());
         double lambda = this.valid ? (first.getY() - refMap3DLat) * Math.PI / 180.0 : 0.0;
         double phi = this.valid ? (first.getX() - refMap3DLon) * Math.PI / 180.0 : 0.0;
         this.x = Math.cos(lambda) * Math.cos(phi);
         this.y = Math.cos(lambda) * Math.sin(phi);
         this.z = Math.sin(lambda);
      }
   }
```

---

## 10. `GLRendererGraphicLineString.java`: `render3D(AGISGL, IGISGraphic)`

4a'nın 3D'si. `positions = graphic1.getPointsForRendering();` satırından sonraki `if (positions != null && positions.length >= 2) { ... }` bloğunun **içindeki her şeyi** (`renderSymbolizedLines` ve `drawArrows` dahil) try/finally içine alın:

```java
      GISPosition[] positions = graphic1.getPointsForRendering();
      if (positions != null && positions.length >= 2) {
         boolean localOrigin = this.beginLocalOrigin3D(positions);
         try {
            // ... bloğun mevcut içeriği aynen (renderSymbolizedLines, getGlIndex(true), display list, drawArrows) ...
         } finally {
            this.endLocalOrigin3D(localOrigin);
         }
      }
```

---

## 11. `GLRendererGraphicPolygon.java`: `render3D(AGISGL, IGISGraphic)`

```java
   public void render3D(AGISGL aGl, IGISGraphic agraphic) {
      this.preRender(aGl, agraphic, false);
      this.preSymbolize((IGISPolygonSymbolizer) this.graphic.getGraphicStyle(), true);
      boolean localOrigin = this.beginLocalOrigin3D(((IGISGraphicPolygon) this.graphic).getPointsForRendering());
      try {
         this.renderPolygon(false, true);
      } finally {
         this.endLocalOrigin3D(localOrigin);
      }
      this.postSymbolize((IGISPolygonSymbolizer) this.graphic.getGraphicStyle(), true);
   }
```

---

## Kontrol (derledikten sonra, 2 dakika)

1. Harita açılınca projede şunu çağırın, sonra 100 yarda'ya zoom yapıp bir çember ve çapraz çizgi çizin:
   ```java
   map.setMinScaleInKm(0.09144);
   ```
   Varsayılan alt sınır 200 m olarak kalır; bu çağrıyı yapmayan projeler etkilenmez.
   - Şekiller çizildikten sonra projeksiyonu Cassini'ye çevirin: çember yine düzgün kalmalı. Köşeli olursa 3d'deki projeksiyon kontrolü eksiktir.
2. İsteğe bağlı doğrulama: JVM'e `-Dtmap.verifyMapPointTranslation=true` verin ve `TGLDesktopJOGL2` logger'ını INFO seviyesine açın. Log'da şu satır çıkmalı:
   ```
   Map point translations: N precise, M plain, 0 verification mismatches
   ```
   - Sayılar 2D ve 3D ötelemelerinin toplamıdır.
   - `precise` sıfır ise `Map2D` değişikliği (adım 6) eksiktir.
   - `mismatches` sıfırdan büyükse, sizin kaynakta wrapper'ı atlayan bir matris çağrısı vardır; bana gösterin.
3. 3D'yi tam ekran açıp en yakın zoom'a inin: globe görünmeli, siyah olmamalı (adım 2f).
4. 3D'de 100 yarda'da çember ve çizgi 2D'deki kadar düzgün olmalı (adım 7–11).
   - Ölçek de değişir: 91 m'de şekiller eskisinden yaklaşık 2.6 kat büyük görünür. Doğrusu bu; sol kenardaki 3D ölçek çubuğuyla uyumlu (30 m'lik çember, 50 m'lik çubuğun yaklaşık 0.6'sı). Eskiden sürücünün `glRotated` hatası kamerayı geri itiyordu (adım 2e).
   - Doğrulama açıkken 3D'de `plain` sayısı artıyorsa 2c'de bir satır eksik olabilir.
