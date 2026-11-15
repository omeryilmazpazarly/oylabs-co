/**
 * The four App Builder layouts. Generated from the storefront app's
 * lib/demo/layouts.json so the dashboard, the landing preview and the built app agree.
 * `layout` and `theme` go to the app as is; `branding` is the look a store starts
 * with when its own colours aren't known.
 */
export const LAYOUT_IDS = ['classic', 'luxe', 'bold', 'editorial'] as const;
export type LayoutId = (typeof LAYOUT_IDS)[number];

export const isLayoutId = (v: unknown): v is LayoutId => typeof v === 'string' && (LAYOUT_IDS as readonly string[]).includes(v);

export const LAYOUTS = {
  "classic": {
    "name": {
      "en": "Classic",
      "ar": "كلاسيك"
    },
    "description": {
      "en": "The big retail look: hero banner, category cards and a labelled tab bar.",
      "ar": "شكل تطبيقات التسوق الكبرى: بانر رئيسي، بطاقات الفئات وشريط تبويب واضح."
    },
    "layout": {
      "nav": "bar",
      "tabs": [
        "index",
        "shop",
        "reels",
        "bag",
        "account"
      ],
      "header": "centered",
      "home": "hero"
    },
    "theme": {},
    "branding": {
      "colors": {
        "primary": "#171717",
        "accent": "#7A5F37",
        "background": "#FFFFFF",
        "canvas": "#F9F9F9",
        "text": "#222222",
        "sale": "#DB3022"
      },
      "buttonStyle": "rounded",
      "radius": 8
    }
  },
  "luxe": {
    "name": {
      "en": "Luxe",
      "ar": "فاخر"
    },
    "description": {
      "en": "Boutique feel: coloured header, serif type, big category tiles, icon-only tabs.",
      "ar": "إحساس البوتيك: هيدر ملوّن، خط كلاسيكي، مربعات فئات كبيرة وتبويبات بالأيقونات فقط."
    },
    "layout": {
      "nav": "minimal",
      "tabs": [
        "index",
        "shop",
        "bag",
        "account"
      ],
      "header": "brand",
      "home": "editorial"
    },
    "theme": {
      "fonts": {
        "display": "CormorantGaramond-SemiBold",
        "body": "Jost-Regular",
        "weights": {
          "display": {
            "regular": "CormorantGaramond-Medium",
            "medium": "CormorantGaramond-SemiBold",
            "semibold": "CormorantGaramond-SemiBold",
            "bold": "CormorantGaramond-SemiBold"
          },
          "body": {
            "light": "Jost-Light",
            "regular": "Jost-Regular",
            "medium": "Jost-Medium",
            "semibold": "Jost-SemiBold",
            "bold": "Jost-Bold"
          }
        },
        "arabic": {
          "regular": "IBMPlexSansArabic-Regular",
          "medium": "IBMPlexSansArabic-Medium",
          "semibold": "IBMPlexSansArabic-SemiBold",
          "bold": "IBMPlexSansArabic-Bold"
        }
      },
      "colors": {
        "band": "#EFE6D6",
        "border": "#E6DCCB",
        "borderStrong": "#D9CCB6",
        "divider": "#EFE8DC",
        "placeholder": "#EFE6D6",
        "placeholderAlt": "#E6DAC6",
        "onInkAccent": "#E3CFA6"
      }
    },
    "branding": {
      "colors": {
        "primary": "#2B2622",
        "accent": "#8A6A2F",
        "background": "#FBF8F3",
        "canvas": "#F4EFE6",
        "text": "#2B2622",
        "sale": "#9B2C2C"
      },
      "buttonStyle": "square",
      "radius": 0
    }
  },
  "bold": {
    "name": {
      "en": "Bold",
      "ar": "جريء"
    },
    "description": {
      "en": "Social style: story circles, reels up front and a floating tab bar.",
      "ar": "أسلوب السوشيال: دوائر قصص، الريلز في المقدمة وشريط تبويب عائم."
    },
    "layout": {
      "nav": "floating",
      "tabs": [
        "index",
        "reels",
        "shop",
        "bag",
        "account"
      ],
      "header": "compact",
      "home": "stories"
    },
    "theme": {
      "fonts": {
        "display": "BricolageGrotesque-SemiBold",
        "body": "Jost-Regular",
        "weights": {
          "display": {
            "regular": "BricolageGrotesque-Medium",
            "medium": "BricolageGrotesque-SemiBold",
            "semibold": "BricolageGrotesque-SemiBold",
            "bold": "BricolageGrotesque-SemiBold"
          },
          "body": {
            "light": "Jost-Light",
            "regular": "Jost-Regular",
            "medium": "Jost-Medium",
            "semibold": "Jost-SemiBold",
            "bold": "Jost-Bold"
          }
        },
        "arabic": {
          "regular": "IBMPlexSansArabic-Regular",
          "medium": "IBMPlexSansArabic-Medium",
          "semibold": "IBMPlexSansArabic-SemiBold",
          "bold": "IBMPlexSansArabic-Bold"
        }
      },
      "colors": {
        "band": "#FFE7D6",
        "border": "#F5E1D3",
        "borderStrong": "#EBCBB5",
        "divider": "#FBEDE3",
        "placeholder": "#FFEDE0",
        "placeholderAlt": "#FBE1CF",
        "onInkAccent": "#FFD3B8"
      }
    },
    "branding": {
      "colors": {
        "primary": "#B4441F",
        "accent": "#B4441F",
        "background": "#FFFFFF",
        "canvas": "#FFF4EC",
        "text": "#1F1A17",
        "sale": "#B4441F"
      },
      "buttonStyle": "pill",
      "radius": 16
    }
  },
  "editorial": {
    "name": {
      "en": "Market",
      "ar": "ماركت"
    },
    "description": {
      "en": "Shop-first: category chips and products straight away, no reels tab.",
      "ar": "التسوق أولاً: فئات سريعة ومنتجات مباشرة بدون تبويب الريلز."
    },
    "layout": {
      "nav": "bar",
      "tabs": [
        "index",
        "shop",
        "bag",
        "account"
      ],
      "header": "compact",
      "home": "grid"
    },
    "theme": {
      "fonts": {
        "display": "DMSerifDisplay-Regular",
        "body": "Jost-Regular",
        "weights": {
          "display": {
            "regular": "DMSerifDisplay-Regular",
            "medium": "DMSerifDisplay-Regular",
            "semibold": "DMSerifDisplay-Regular",
            "bold": "DMSerifDisplay-Regular"
          },
          "body": {
            "light": "Jost-Light",
            "regular": "Jost-Regular",
            "medium": "Jost-Medium",
            "semibold": "Jost-SemiBold",
            "bold": "Jost-Bold"
          }
        },
        "arabic": {
          "regular": "IBMPlexSansArabic-Regular",
          "medium": "IBMPlexSansArabic-Medium",
          "semibold": "IBMPlexSansArabic-SemiBold",
          "bold": "IBMPlexSansArabic-Bold"
        }
      },
      "colors": {
        "band": "#E8EDE6",
        "border": "#E4E6DD",
        "borderStrong": "#CDD3C7",
        "divider": "#EEF0E9",
        "placeholder": "#ECEEE6",
        "placeholderAlt": "#E1E5DB",
        "onInkAccent": "#C9D8C2"
      }
    },
    "branding": {
      "colors": {
        "primary": "#1F3D2B",
        "accent": "#8C6A3F",
        "background": "#FFFFFF",
        "canvas": "#F3F1EA",
        "text": "#1C1C1A",
        "sale": "#A23B2A"
      },
      "buttonStyle": "rounded",
      "radius": 4
    }
  }
} as const;
