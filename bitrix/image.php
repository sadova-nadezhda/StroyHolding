<?php
/**
 * Ресайз изображений инфоблоков + генерация WebP + вывод <picture>.
 *
 * Установка:
 *   1. Положить файл в /local/php_interface/include/image.php
 *   2. В /local/php_interface/init.php добавить:
 *        require_once __DIR__ . '/include/image.php';
 *
 * Требования: расширение GD с поддержкой WebP (проверка: function_exists('imagewebp')).
 */

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    die();
}

/**
 * Ресайзит картинку и отдаёт пути к обычной версии и к WebP.
 *
 * @param mixed $file   ID файла, либо массив PREVIEW_PICTURE/DETAIL_PICTURE
 * @param int   $width  максимальная ширина в пикселях (физических, не CSS)
 * @param int   $height максимальная высота
 * @param int   $mode   BX_RESIZE_IMAGE_PROPORTIONAL | BX_RESIZE_IMAGE_EXACT
 *
 * @return array{src: string, webp: string, width: int, height: int}
 */
function appImageResize($file, int $width, int $height, int $mode = BX_RESIZE_IMAGE_PROPORTIONAL): array
{
    $empty = ['src' => '', 'webp' => '', 'width' => 0, 'height' => 0];

    if (is_array($file)) {
        $file = $file['ID'] ?? 0;
    }
    $file = (int)$file;
    if ($file <= 0) {
        return $empty;
    }

    $resized = CFile::ResizeImageGet(
        $file,
        ['width' => $width, 'height' => $height],
        $mode,
        true,   // записать размеры
        false,
        false,
        88      // качество jpg
    );

    if (empty($resized['src'])) {
        return $empty;
    }

    return [
        'src'    => $resized['src'],
        'webp'   => appImageWebp($resized['src']),
        'width'  => (int)($resized['width'] ?? 0),
        'height' => (int)($resized['height'] ?? 0),
    ];
}

/**
 * Делает WebP-копию рядом с исходником (photo.png -> photo.png.webp).
 * Результат кешируется на диске: конвертация происходит один раз.
 *
 * @return string путь к webp от корня сайта или '' если сконвертировать не удалось
 */
function appImageWebp(string $src): string
{
    if ($src === '') {
        return '';
    }

    $root   = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
    $source = $root . $src;

    if (!is_file($source)) {
        return '';
    }

    $ext = strtolower(pathinfo($source, PATHINFO_EXTENSION));
    if ($ext === 'webp') {
        return $src;                       // уже webp — конвертировать нечего
    }
    if (!in_array($ext, ['jpg', 'jpeg', 'png'], true) || !function_exists('imagewebp')) {
        return '';
    }

    $webpSrc  = $src . '.webp';
    $webpPath = $root . $webpSrc;

    // Готовый и не устаревший файл переиспользуем
    if (is_file($webpPath) && filemtime($webpPath) >= filemtime($source)) {
        return $webpSrc;
    }

    $image = ($ext === 'png') ? @imagecreatefrompng($source) : @imagecreatefromjpeg($source);
    if (!$image) {
        return '';
    }

    if ($ext === 'png') {
        imagepalettetotruecolor($image);
        imagealphablending($image, true);
        imagesavealpha($image, true);      // сохраняем прозрачность
    }

    $ok = @imagewebp($image, $webpPath, 82);
    imagedestroy($image);

    return $ok ? $webpSrc : '';
}

/**
 * Готовый <picture> с WebP и fallback-ом.
 *
 * @param array $options
 *        alt      — атрибут alt
 *        class    — класс на <img>
 *        lazy     — true (по умолчанию) => loading="lazy"; false => fetchpriority="high" для первого экрана
 *        mode     — режим ресайза
 *        retina   — true => добавить 2x в srcset
 */
function appImagePicture($file, int $width, int $height, array $options = []): string
{
    $mode = $options['mode'] ?? BX_RESIZE_IMAGE_PROPORTIONAL;
    $img  = appImageResize($file, $width, $height, $mode);

    if ($img['src'] === '') {
        return '';
    }

    $alt   = htmlspecialcharsbx((string)($options['alt'] ?? ''));
    $class = (string)($options['class'] ?? '');
    $lazy  = ($options['lazy'] ?? true)
        ? ' loading="lazy" decoding="async"'
        : ' fetchpriority="high" decoding="async"';

    // Размеры в атрибутах убирают скачок вёрстки при загрузке (CLS)
    $size = ($img['width'] && $img['height'])
        ? ' width="' . $img['width'] . '" height="' . $img['height'] . '"'
        : '';

    $srcset     = '';
    $webpSrcset = $img['webp'];

    if (!empty($options['retina'])) {
        $img2x = appImageResize($file, $width * 2, $height * 2, $mode);
        if ($img2x['src'] !== '' && $img2x['src'] !== $img['src']) {
            $srcset = ' srcset="' . $img['src'] . ' 1x, ' . $img2x['src'] . ' 2x"';
            if ($img['webp'] && $img2x['webp']) {
                $webpSrcset = $img['webp'] . ' 1x, ' . $img2x['webp'] . ' 2x';
            }
        }
    }

    $tag = '<img src="' . $img['src'] . '"' . $srcset
         . ' alt="' . $alt . '"'
         . ($class !== '' ? ' class="' . htmlspecialcharsbx($class) . '"' : '')
         . $size . $lazy . '>';

    if ($webpSrcset === '') {
        return $tag;
    }

    return '<picture><source srcset="' . $webpSrcset . '" type="image/webp">' . $tag . '</picture>';
}
