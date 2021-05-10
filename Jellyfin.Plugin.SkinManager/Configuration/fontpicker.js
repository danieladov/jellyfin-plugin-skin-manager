/**
 * jQuery.fontpicker - A font picker for Google Web Fonts and local fonts.
 *
 * Made by Arjan Haverkamp, https://www.webgear.nl
 * Copyright 2020-2021 Arjan Haverkamp
 * MIT Licensed
 * @version 1.4.1 - 2020-04-28
 * @url https://github.com/av01d/fontpicker-jquery-plugin
 */


(function($){

	var pluginName = 'fontpicker';
	var fontsLoaded = {};

	var googleFontLangs = {
		'arabic': 'Arabic',
		'bengali': 'Bengali',
		'chinese-hongkong': 'Chinese (Hong Kong)',
		'chinese-simplified': 'Chinese (Simplified',
		'chinese-traditional': 'Chinese (Traditional)',
		'cyrillic': 'Cyrillic',
		'cyrillic-ext': 'Cyrillic Extended',
		'devanagari': 'Devanagari',
		'greek': 'Greek',
		'greek-ext': 'Greek Extended',
		'gujarati': 'Gujarati',
		'gurmukhi': 'Gurmukhi',
		'hebrew': 'Hebrew',
		'japanese': 'Japanese',
		'kannada': 'Kannada',
		'khmer': 'Khmer',
		'korean': 'Korean',
		'latin': 'Latin',
		'latin-ext': 'Latin Extended',
		'malayalam': 'Malayalam',
		'myanmar': 'Myanmar',
		'oriya': 'Oriya',
		'sinhala': 'Sinhala',
		'tamil': 'Tamil',
		'telugu': 'Telugu',
		'thai': 'Thai',
		'tibetan': 'Tibetan',
		'vietnamese': 'Vietnamese'
	};

	var googleFontCats = ['serif', 'sans-serif', 'display', 'handwriting', 'monospace'];

	// Object.keys(..).length for all browsers, including IE <= 11:
	function objLength(obj) {
		var nr = 0;
		for (var i in obj) {
			if (obj.hasOwnProperty(i)) { nr++; }
		}
		return nr;
	}

	$.fn.fontpicker = function(options) {

		var __scrollIntoViewIfNeeded = function(elem) {
			var container = elem.parentElement;
			var rectElem = elem.getBoundingClientRect(), rectContainer = container.getBoundingClientRect();
			if (rectElem.bottom > rectContainer.bottom) { elem.scrollIntoView(false); }
			if (rectElem.top < rectContainer.top) { elem.scrollIntoView(); }
		};

		/**
		 * Utility function for getting/setting cookies.
		 * This function stores multiple values in one single cookie: max efficiency!
		 * Also: this function gets/sets cookies that PHP can also get/set (static Cookie class).
		 * Cookies are valid for 365 days.
		 *
		 * @param {string} key Name of the value to store.
		 * @param {string} value Value to store. Omit to get a cookie, provide to set a cookie.
		 * @return {string} The value for a cookie (when value is omitted, of course).
		 */
		var __cookie = function(key, value) {
			var cookieName = 'jqfs', cookieDays = 365, result, date = new Date(), jar = {}, expires = '', x, pts, pt;
			result = (result = new RegExp('(?:^|; )'+cookieName+'=([^;]*)').exec(document.cookie)) ? decodeURIComponent(result[1]) : null;

			if (null !== result) {
				pts = result.split('||');
				for (x in pts) {
					try {
						pt = pts[x].split('|',2);
						jar[pt[0]] = pt[1];
					} catch (e) {}
				}
			}

			// Get cookie:
			if (1 === arguments.length) {
				return jar[key];
			}

			// Set cookie
			if (null === value || false === value) {
				delete jar[key];
			}
			else {
				jar[key] = value;
			}

			pts = [];
			for (x in jar) {
				pts.push(x+'|'+jar[x]);
			}

			if (cookieDays > 0) {
				date.setTime(date.getTime()+(cookieDays*24*60*60*1000));
				expires = '; expires='+date.toGMTString();
			}
			document.cookie = cookieName + '=' + encodeURIComponent(pts.join('||')) + '; path=/; SameSite=Lax' + expires;
		};

		var __googleFonts = {
			// This list was last updated on December 8, 2020
			"ABeeZee": {
				"category": "sans-serif",
				"variants": "400,400i",
				"subsets": "latin"
			},
			"Abel": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Abhaya Libre": {
				"category": "serif",
				"variants": "400,500,600,700,800",
				"subsets": "latin,latin-ext,sinhala"
			},
			"Abril Fatface": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Aclonica": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Acme": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Actor": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Adamina": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Advent Pro": {
				"category": "sans-serif",
				"variants": "100,200,300,400,500,600,700",
				"subsets": "greek,latin,latin-ext"
			},
			"Aguafina Script": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Akronim": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Aladin": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Alata": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Alatsi": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Aldrich": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Alef": {
				"category": "sans-serif",
				"variants": "400,700",
				"subsets": "hebrew,latin"
			},
			"Alegreya": {
				"category": "serif",
				"variants": "400,400i,500,500i,700,700i,800,800i,900,900i",
				"subsets": "cyrillic,cyrillic-ext,greek,greek-ext,latin,latin-ext,vietnamese"
			},
			"Alegreya SC": {
				"category": "serif",
				"variants": "400,400i,500,500i,700,700i,800,800i,900,900i",
				"subsets": "cyrillic,cyrillic-ext,greek,greek-ext,latin,latin-ext,vietnamese"
			},
			"Alegreya Sans": {
				"category": "sans-serif",
				"variants": "100,100i,300,300i,400,400i,500,500i,700,700i,800,800i,900,900i",
				"subsets": "cyrillic,cyrillic-ext,greek,greek-ext,latin,latin-ext,vietnamese"
			},
			"Alegreya Sans SC": {
				"category": "sans-serif",
				"variants": "100,100i,300,300i,400,400i,500,500i,700,700i,800,800i,900,900i",
				"subsets": "cyrillic,cyrillic-ext,greek,greek-ext,latin,latin-ext,vietnamese"
			},
			"Aleo": {
				"category": "serif",
				"variants": "300,300i,400,400i,700,700i",
				"subsets": "latin,latin-ext"
			},
			"Alex Brush": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Alfa Slab One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Alice": {
				"category": "serif",
				"variants": "400",
				"subsets": "cyrillic,cyrillic-ext,latin"
			},
			"Alike": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Alike Angular": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Allan": {
				"category": "display",
				"variants": "400,700",
				"subsets": "latin,latin-ext"
			},
			"Allerta": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Allerta Stencil": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Allura": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Almarai": {
				"category": "sans-serif",
				"variants": "300,400,700,800",
				"subsets": "arabic"
			},
			"Almendra": {
				"category": "serif",
				"variants": "400,400i,700,700i",
				"subsets": "latin,latin-ext"
			},
			"Almendra Display": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Almendra SC": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Amarante": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Amaranth": {
				"category": "sans-serif",
				"variants": "400,400i,700,700i",
				"subsets": "latin"
			},
			"Amatic SC": {
				"category": "handwriting",
				"variants": "400,700",
				"subsets": "cyrillic,hebrew,latin,latin-ext,vietnamese"
			},
			"Amethysta": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Amiko": {
				"category": "sans-serif",
				"variants": "400,600,700",
				"subsets": "devanagari,latin,latin-ext"
			},
			"Amiri": {
				"category": "serif",
				"variants": "400,400i,700,700i",
				"subsets": "arabic,latin,latin-ext"
			},
			"Amita": {
				"category": "handwriting",
				"variants": "400,700",
				"subsets": "devanagari,latin,latin-ext"
			},
			"Anaheim": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Andada": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Andika": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext,vietnamese"
			},
			"Andika New Basic": {
				"category": "sans-serif",
				"variants": "400,400i,700,700i",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Angkor": {
				"category": "display",
				"variants": "400",
				"subsets": "khmer"
			},
			"Annie Use Your Telescope": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Anonymous Pro": {
				"category": "monospace",
				"variants": "400,400i,700,700i",
				"subsets": "cyrillic,greek,latin,latin-ext"
			},
			"Antic": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Antic Didone": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Antic Slab": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Anton": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Arapey": {
				"category": "serif",
				"variants": "400,400i",
				"subsets": "latin"
			},
			"Arbutus": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Arbutus Slab": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Architects Daughter": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Archivo": {
				"category": "sans-serif",
				"variants": "400,400i,500,500i,600,600i,700,700i",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Archivo Black": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Archivo Narrow": {
				"category": "sans-serif",
				"variants": "400,400i,500,500i,600,600i,700,700i",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Aref Ruqaa": {
				"category": "serif",
				"variants": "400,700",
				"subsets": "arabic,latin,latin-ext"
			},
			"Arima Madurai": {
				"category": "display",
				"variants": "100,200,300,400,500,700,800,900",
				"subsets": "latin,latin-ext,tamil,vietnamese"
			},
			"Arimo": {
				"category": "sans-serif",
				"variants": "400,500,600,700,400i,500i,600i,700i",
				"subsets": "cyrillic,cyrillic-ext,greek,greek-ext,hebrew,latin,latin-ext,vietnamese"
			},
			"Arizonia": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Armata": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Arsenal": {
				"category": "sans-serif",
				"variants": "400,400i,700,700i",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext,vietnamese"
			},
			"Artifika": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Arvo": {
				"category": "serif",
				"variants": "400,400i,700,700i",
				"subsets": "latin"
			},
			"Arya": {
				"category": "sans-serif",
				"variants": "400,700",
				"subsets": "devanagari,latin,latin-ext"
			},
			"Asap": {
				"category": "sans-serif",
				"variants": "400,400i,500,500i,600,600i,700,700i",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Asap Condensed": {
				"category": "sans-serif",
				"variants": "400,400i,500,500i,600,600i,700,700i",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Asar": {
				"category": "serif",
				"variants": "400",
				"subsets": "devanagari,latin,latin-ext"
			},
			"Asset": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Assistant": {
				"category": "sans-serif",
				"variants": "200,300,400,500,600,700,800",
				"subsets": "hebrew,latin,latin-ext"
			},
			"Astloch": {
				"category": "display",
				"variants": "400,700",
				"subsets": "latin"
			},
			"Asul": {
				"category": "sans-serif",
				"variants": "400,700",
				"subsets": "latin"
			},
			"Athiti": {
				"category": "sans-serif",
				"variants": "200,300,400,500,600,700",
				"subsets": "latin,latin-ext,thai,vietnamese"
			},
			"Atma": {
				"category": "display",
				"variants": "300,400,500,600,700",
				"subsets": "bengali,latin,latin-ext"
			},
			"Atomic Age": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Aubrey": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Audiowide": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Autour One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Average": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Average Sans": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Averia Gruesa Libre": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Averia Libre": {
				"category": "display",
				"variants": "300,300i,400,400i,700,700i",
				"subsets": "latin"
			},
			"Averia Sans Libre": {
				"category": "display",
				"variants": "300,300i,400,400i,700,700i",
				"subsets": "latin"
			},
			"Averia Serif Libre": {
				"category": "display",
				"variants": "300,300i,400,400i,700,700i",
				"subsets": "latin"
			},
			"B612": {
				"category": "sans-serif",
				"variants": "400,400i,700,700i",
				"subsets": "latin"
			},
			"B612 Mono": {
				"category": "monospace",
				"variants": "400,400i,700,700i",
				"subsets": "latin"
			},
			"Bad Script": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "cyrillic,latin"
			},
			"Bahiana": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Bahianita": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Bai Jamjuree": {
				"category": "sans-serif",
				"variants": "200,200i,300,300i,400,400i,500,500i,600,600i,700,700i",
				"subsets": "latin,latin-ext,thai,vietnamese"
			},
			"Baloo 2": {
				"category": "display",
				"variants": "400,500,600,700,800",
				"subsets": "devanagari,latin,latin-ext,vietnamese"
			},
			"Baloo Bhai 2": {
				"category": "display",
				"variants": "400,500,600,700,800",
				"subsets": "gujarati,latin,latin-ext,vietnamese"
			},
			"Baloo Bhaina 2": {
				"category": "display",
				"variants": "400,500,600,700,800",
				"subsets": "latin,latin-ext,oriya,vietnamese"
			},
			"Baloo Chettan 2": {
				"category": "display",
				"variants": "400,500,600,700,800",
				"subsets": "latin,latin-ext,malayalam,vietnamese"
			},
			"Baloo Da 2": {
				"category": "display",
				"variants": "400,500,600,700,800",
				"subsets": "bengali,latin,latin-ext,vietnamese"
			},
			"Baloo Paaji 2": {
				"category": "display",
				"variants": "400,500,600,700,800",
				"subsets": "gurmukhi,latin,latin-ext,vietnamese"
			},
			"Baloo Tamma 2": {
				"category": "display",
				"variants": "400,500,600,700,800",
				"subsets": "kannada,latin,latin-ext,vietnamese"
			},
			"Baloo Tammudu 2": {
				"category": "display",
				"variants": "400,500,600,700,800",
				"subsets": "latin,latin-ext,telugu,vietnamese"
			},
			"Baloo Thambi 2": {
				"category": "display",
				"variants": "400,500,600,700,800",
				"subsets": "latin,latin-ext,tamil,vietnamese"
			},
			"Balsamiq Sans": {
				"category": "display",
				"variants": "400,400i,700,700i",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext"
			},
			"Balthazar": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Bangers": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Barlow": {
				"category": "sans-serif",
				"variants": "100,100i,200,200i,300,300i,400,400i,500,500i,600,600i,700,700i,800,800i,900,900i",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Barlow Condensed": {
				"category": "sans-serif",
				"variants": "100,100i,200,200i,300,300i,400,400i,500,500i,600,600i,700,700i,800,800i,900,900i",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Barlow Semi Condensed": {
				"category": "sans-serif",
				"variants": "100,100i,200,200i,300,300i,400,400i,500,500i,600,600i,700,700i,800,800i,900,900i",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Barriecito": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Barrio": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Basic": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Baskervville": {
				"category": "serif",
				"variants": "400,400i",
				"subsets": "latin,latin-ext"
			},
			"Battambang": {
				"category": "display",
				"variants": "400,700",
				"subsets": "khmer"
			},
			"Baumans": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Bayon": {
				"category": "display",
				"variants": "400",
				"subsets": "khmer"
			},
			"Be Vietnam": {
				"category": "sans-serif",
				"variants": "100,100i,300,300i,400,400i,500,500i,600,600i,700,700i,800,800i",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Bebas Neue": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Belgrano": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Bellefair": {
				"category": "serif",
				"variants": "400",
				"subsets": "hebrew,latin,latin-ext"
			},
			"Belleza": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Bellota": {
				"category": "display",
				"variants": "300,300i,400,400i,700,700i",
				"subsets": "cyrillic,latin,latin-ext,vietnamese"
			},
			"Bellota Text": {
				"category": "display",
				"variants": "300,300i,400,400i,700,700i",
				"subsets": "cyrillic,latin,latin-ext,vietnamese"
			},
			"BenchNine": {
				"category": "sans-serif",
				"variants": "300,400,700",
				"subsets": "latin,latin-ext"
			},
			"Bentham": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Berkshire Swash": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Beth Ellen": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Bevan": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Big Shoulders Display": {
				"category": "display",
				"variants": "100,300,400,500,600,700,800,900",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Big Shoulders Inline Display": {
				"category": "display",
				"variants": "100,300,400,500,600,700,800,900",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Big Shoulders Inline Text": {
				"category": "display",
				"variants": "100,300,400,500,600,700,800,900",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Big Shoulders Stencil Display": {
				"category": "display",
				"variants": "100,300,400,500,600,700,800,900",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Big Shoulders Stencil Text": {
				"category": "display",
				"variants": "100,300,400,500,600,700,800,900",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Big Shoulders Text": {
				"category": "display",
				"variants": "100,300,400,500,600,700,800,900",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Bigelow Rules": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Bigshot One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Bilbo": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Bilbo Swash Caps": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"BioRhyme": {
				"category": "serif",
				"variants": "200,300,400,700,800",
				"subsets": "latin,latin-ext"
			},
			"BioRhyme Expanded": {
				"category": "serif",
				"variants": "200,300,400,700,800",
				"subsets": "latin,latin-ext"
			},
			"Biryani": {
				"category": "sans-serif",
				"variants": "200,300,400,600,700,800,900",
				"subsets": "devanagari,latin,latin-ext"
			},
			"Bitter": {
				"category": "serif",
				"variants": "100,200,300,400,500,600,700,800,900,100i,200i,300i,400i,500i,600i,700i,800i,900i",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext,vietnamese"
			},
			"Black And White Picture": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "korean,latin"
			},
			"Black Han Sans": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "korean,latin"
			},
			"Black Ops One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Blinker": {
				"category": "sans-serif",
				"variants": "100,200,300,400,600,700,800,900",
				"subsets": "latin,latin-ext"
			},
			"Bokor": {
				"category": "display",
				"variants": "400",
				"subsets": "khmer"
			},
			"Bonbon": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Boogaloo": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Bowlby One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Bowlby One SC": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Brawler": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Bree Serif": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Bubblegum Sans": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Bubbler One": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Buda": {
				"category": "display",
				"variants": "300",
				"subsets": "latin"
			},
			"Buenard": {
				"category": "serif",
				"variants": "400,700",
				"subsets": "latin,latin-ext"
			},
			"Bungee": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Bungee Hairline": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Bungee Inline": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Bungee Outline": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Bungee Shade": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Butcherman": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Butterfly Kids": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Cabin": {
				"category": "sans-serif",
				"variants": "400,500,600,700,400i,500i,600i,700i",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Cabin Condensed": {
				"category": "sans-serif",
				"variants": "400,500,600,700",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Cabin Sketch": {
				"category": "display",
				"variants": "400,700",
				"subsets": "latin"
			},
			"Caesar Dressing": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Cagliostro": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Cairo": {
				"category": "sans-serif",
				"variants": "200,300,400,600,700,900",
				"subsets": "arabic,latin,latin-ext"
			},
			"Caladea": {
				"category": "serif",
				"variants": "400,400i,700,700i",
				"subsets": "latin,latin-ext"
			},
			"Calistoga": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Calligraffitti": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Cambay": {
				"category": "sans-serif",
				"variants": "400,400i,700,700i",
				"subsets": "devanagari,latin,latin-ext"
			},
			"Cambo": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Candal": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Cantarell": {
				"category": "sans-serif",
				"variants": "400,400i,700,700i",
				"subsets": "latin"
			},
			"Cantata One": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Cantora One": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Capriola": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Cardo": {
				"category": "serif",
				"variants": "400,400i,700",
				"subsets": "greek,greek-ext,latin,latin-ext"
			},
			"Carme": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Carrois Gothic": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Carrois Gothic SC": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Carter One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Castoro": {
				"category": "serif",
				"variants": "400,400i",
				"subsets": "latin,latin-ext"
			},
			"Catamaran": {
				"category": "sans-serif",
				"variants": "100,200,300,400,500,600,700,800,900",
				"subsets": "latin,latin-ext,tamil"
			},
			"Caudex": {
				"category": "serif",
				"variants": "400,400i,700,700i",
				"subsets": "greek,greek-ext,latin,latin-ext"
			},
			"Caveat": {
				"category": "handwriting",
				"variants": "400,500,600,700",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext"
			},
			"Caveat Brush": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Cedarville Cursive": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Ceviche One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Chakra Petch": {
				"category": "sans-serif",
				"variants": "300,300i,400,400i,500,500i,600,600i,700,700i",
				"subsets": "latin,latin-ext,thai,vietnamese"
			},
			"Changa": {
				"category": "sans-serif",
				"variants": "200,300,400,500,600,700,800",
				"subsets": "arabic,latin,latin-ext"
			},
			"Changa One": {
				"category": "display",
				"variants": "400,400i",
				"subsets": "latin"
			},
			"Chango": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Charm": {
				"category": "handwriting",
				"variants": "400,700",
				"subsets": "latin,latin-ext,thai,vietnamese"
			},
			"Charmonman": {
				"category": "handwriting",
				"variants": "400,700",
				"subsets": "latin,latin-ext,thai,vietnamese"
			},
			"Chathura": {
				"category": "sans-serif",
				"variants": "100,300,400,700,800",
				"subsets": "latin,telugu"
			},
			"Chau Philomene One": {
				"category": "sans-serif",
				"variants": "400,400i",
				"subsets": "latin,latin-ext"
			},
			"Chela One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Chelsea Market": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Chenla": {
				"category": "display",
				"variants": "400",
				"subsets": "khmer"
			},
			"Cherry Cream Soda": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Cherry Swash": {
				"category": "display",
				"variants": "400,700",
				"subsets": "latin,latin-ext"
			},
			"Chewy": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Chicle": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Chilanka": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,malayalam"
			},
			"Chivo": {
				"category": "sans-serif",
				"variants": "300,300i,400,400i,700,700i,900,900i",
				"subsets": "latin,latin-ext"
			},
			"Chonburi": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext,thai,vietnamese"
			},
			"Cinzel": {
				"category": "serif",
				"variants": "400,500,600,700,800,900",
				"subsets": "latin,latin-ext"
			},
			"Cinzel Decorative": {
				"category": "display",
				"variants": "400,700,900",
				"subsets": "latin"
			},
			"Clicker Script": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Coda": {
				"category": "display",
				"variants": "400,800",
				"subsets": "latin,latin-ext"
			},
			"Coda Caption": {
				"category": "sans-serif",
				"variants": "800",
				"subsets": "latin,latin-ext"
			},
			"Codystar": {
				"category": "display",
				"variants": "300,400",
				"subsets": "latin,latin-ext"
			},
			"Coiny": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext,tamil,vietnamese"
			},
			"Combo": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Comfortaa": {
				"category": "display",
				"variants": "300,400,500,600,700",
				"subsets": "cyrillic,cyrillic-ext,greek,latin,latin-ext,vietnamese"
			},
			"Comic Neue": {
				"category": "handwriting",
				"variants": "300,300i,400,400i,700,700i",
				"subsets": "latin"
			},
			"Coming Soon": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Commissioner": {
				"category": "sans-serif",
				"variants": "100,200,300,400,500,600,700,800,900",
				"subsets": "cyrillic,cyrillic-ext,greek,latin,latin-ext,vietnamese"
			},
			"Concert One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Condiment": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Content": {
				"category": "display",
				"variants": "400,700",
				"subsets": "khmer"
			},
			"Contrail One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Convergence": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Cookie": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Copse": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Corben": {
				"category": "display",
				"variants": "400,700",
				"subsets": "latin,latin-ext"
			},
			"Cormorant": {
				"category": "serif",
				"variants": "300,300i,400,400i,500,500i,600,600i,700,700i",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext,vietnamese"
			},
			"Cormorant Garamond": {
				"category": "serif",
				"variants": "300,300i,400,400i,500,500i,600,600i,700,700i",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext,vietnamese"
			},
			"Cormorant Infant": {
				"category": "serif",
				"variants": "300,300i,400,400i,500,500i,600,600i,700,700i",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext,vietnamese"
			},
			"Cormorant SC": {
				"category": "serif",
				"variants": "300,400,500,600,700",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext,vietnamese"
			},
			"Cormorant Unicase": {
				"category": "serif",
				"variants": "300,400,500,600,700",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext,vietnamese"
			},
			"Cormorant Upright": {
				"category": "serif",
				"variants": "300,400,500,600,700",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Courgette": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Courier Prime": {
				"category": "monospace",
				"variants": "400,400i,700,700i",
				"subsets": "latin,latin-ext"
			},
			"Cousine": {
				"category": "monospace",
				"variants": "400,400i,700,700i",
				"subsets": "cyrillic,cyrillic-ext,greek,greek-ext,hebrew,latin,latin-ext,vietnamese"
			},
			"Coustard": {
				"category": "serif",
				"variants": "400,900",
				"subsets": "latin"
			},
			"Covered By Your Grace": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Crafty Girls": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Creepster": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Crete Round": {
				"category": "serif",
				"variants": "400,400i",
				"subsets": "latin,latin-ext"
			},
			"Crimson Pro": {
				"category": "serif",
				"variants": "200,300,400,500,600,700,800,900,200i,300i,400i,500i,600i,700i,800i,900i",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Crimson Text": {
				"category": "serif",
				"variants": "400,400i,600,600i,700,700i",
				"subsets": "latin"
			},
			"Croissant One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Crushed": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Cuprum": {
				"category": "sans-serif",
				"variants": "400,500,600,700,400i,500i,600i,700i",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext,vietnamese"
			},
			"Cute Font": {
				"category": "display",
				"variants": "400",
				"subsets": "korean,latin"
			},
			"Cutive": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Cutive Mono": {
				"category": "monospace",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"DM Mono": {
				"category": "monospace",
				"variants": "300,300i,400,400i,500,500i",
				"subsets": "latin,latin-ext"
			},
			"DM Sans": {
				"category": "sans-serif",
				"variants": "400,400i,500,500i,700,700i",
				"subsets": "latin,latin-ext"
			},
			"DM Serif Display": {
				"category": "serif",
				"variants": "400,400i",
				"subsets": "latin,latin-ext"
			},
			"DM Serif Text": {
				"category": "serif",
				"variants": "400,400i",
				"subsets": "latin,latin-ext"
			},
			"Damion": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Dancing Script": {
				"category": "handwriting",
				"variants": "400,500,600,700",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Dangrek": {
				"category": "display",
				"variants": "400",
				"subsets": "khmer"
			},
			"Darker Grotesque": {
				"category": "sans-serif",
				"variants": "300,400,500,600,700,800,900",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"David Libre": {
				"category": "serif",
				"variants": "400,500,700",
				"subsets": "hebrew,latin,latin-ext,vietnamese"
			},
			"Dawning of a New Day": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Days One": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Dekko": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "devanagari,latin,latin-ext"
			},
			"Delius": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Delius Swash Caps": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Delius Unicase": {
				"category": "handwriting",
				"variants": "400,700",
				"subsets": "latin"
			},
			"Della Respira": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Denk One": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Devonshire": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Dhurjati": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,telugu"
			},
			"Didact Gothic": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "cyrillic,cyrillic-ext,greek,greek-ext,latin,latin-ext"
			},
			"Diplomata": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Diplomata SC": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Do Hyeon": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "korean,latin"
			},
			"Dokdo": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "korean,latin"
			},
			"Domine": {
				"category": "serif",
				"variants": "400,500,600,700",
				"subsets": "latin,latin-ext"
			},
			"Donegal One": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Doppio One": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Dorsa": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Dosis": {
				"category": "sans-serif",
				"variants": "200,300,400,500,600,700,800",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Dr Sugiyama": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Duru Sans": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Dynalight": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"EB Garamond": {
				"category": "serif",
				"variants": "400,500,600,700,800,400i,500i,600i,700i,800i",
				"subsets": "cyrillic,cyrillic-ext,greek,greek-ext,latin,latin-ext,vietnamese"
			},
			"Eagle Lake": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"East Sea Dokdo": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "korean,latin"
			},
			"Eater": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Economica": {
				"category": "sans-serif",
				"variants": "400,400i,700,700i",
				"subsets": "latin,latin-ext"
			},
			"Eczar": {
				"category": "serif",
				"variants": "400,500,600,700,800",
				"subsets": "devanagari,latin,latin-ext"
			},
			"El Messiri": {
				"category": "sans-serif",
				"variants": "400,500,600,700",
				"subsets": "arabic,cyrillic,latin"
			},
			"Electrolize": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Elsie": {
				"category": "display",
				"variants": "400,900",
				"subsets": "latin,latin-ext"
			},
			"Elsie Swash Caps": {
				"category": "display",
				"variants": "400,900",
				"subsets": "latin,latin-ext"
			},
			"Emblema One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Emilys Candy": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Encode Sans": {
				"category": "sans-serif",
				"variants": "100,200,300,400,500,600,700,800,900",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Encode Sans Condensed": {
				"category": "sans-serif",
				"variants": "100,200,300,400,500,600,700,800,900",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Encode Sans Expanded": {
				"category": "sans-serif",
				"variants": "100,200,300,400,500,600,700,800,900",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Encode Sans Semi Condensed": {
				"category": "sans-serif",
				"variants": "100,200,300,400,500,600,700,800,900",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Encode Sans Semi Expanded": {
				"category": "sans-serif",
				"variants": "100,200,300,400,500,600,700,800,900",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Engagement": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Englebert": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Enriqueta": {
				"category": "serif",
				"variants": "400,500,600,700",
				"subsets": "latin,latin-ext"
			},
			"Epilogue": {
				"category": "sans-serif",
				"variants": "100,200,300,400,500,600,700,800,900,100i,200i,300i,400i,500i,600i,700i,800i,900i",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Erica One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Esteban": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Euphoria Script": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Ewert": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Exo": {
				"category": "sans-serif",
				"variants": "100,200,300,400,500,600,700,800,900,100i,200i,300i,400i,500i,600i,700i,800i,900i",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Exo 2": {
				"category": "sans-serif",
				"variants": "100,200,300,400,500,600,700,800,900,100i,200i,300i,400i,500i,600i,700i,800i,900i",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext,vietnamese"
			},
			"Expletus Sans": {
				"category": "display",
				"variants": "400,400i,500,500i,600,600i,700,700i",
				"subsets": "latin"
			},
			"Fahkwang": {
				"category": "sans-serif",
				"variants": "200,200i,300,300i,400,400i,500,500i,600,600i,700,700i",
				"subsets": "latin,latin-ext,thai,vietnamese"
			},
			"Fanwood Text": {
				"category": "serif",
				"variants": "400,400i",
				"subsets": "latin"
			},
			"Farro": {
				"category": "sans-serif",
				"variants": "300,400,500,700",
				"subsets": "latin,latin-ext"
			},
			"Farsan": {
				"category": "display",
				"variants": "400",
				"subsets": "gujarati,latin,latin-ext,vietnamese"
			},
			"Fascinate": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Fascinate Inline": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Faster One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Fasthand": {
				"category": "serif",
				"variants": "400",
				"subsets": "khmer"
			},
			"Fauna One": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Faustina": {
				"category": "serif",
				"variants": "400,500,600,700,400i,500i,600i,700i",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Federant": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Federo": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Felipa": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Fenix": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Finger Paint": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Fira Code": {
				"category": "monospace",
				"variants": "300,400,500,600,700",
				"subsets": "cyrillic,cyrillic-ext,greek,greek-ext,latin,latin-ext"
			},
			"Fira Mono": {
				"category": "monospace",
				"variants": "400,500,700",
				"subsets": "cyrillic,cyrillic-ext,greek,greek-ext,latin,latin-ext"
			},
			"Fira Sans": {
				"category": "sans-serif",
				"variants": "100,100i,200,200i,300,300i,400,400i,500,500i,600,600i,700,700i,800,800i,900,900i",
				"subsets": "cyrillic,cyrillic-ext,greek,greek-ext,latin,latin-ext,vietnamese"
			},
			"Fira Sans Condensed": {
				"category": "sans-serif",
				"variants": "100,100i,200,200i,300,300i,400,400i,500,500i,600,600i,700,700i,800,800i,900,900i",
				"subsets": "cyrillic,cyrillic-ext,greek,greek-ext,latin,latin-ext,vietnamese"
			},
			"Fira Sans Extra Condensed": {
				"category": "sans-serif",
				"variants": "100,100i,200,200i,300,300i,400,400i,500,500i,600,600i,700,700i,800,800i,900,900i",
				"subsets": "cyrillic,cyrillic-ext,greek,greek-ext,latin,latin-ext,vietnamese"
			},
			"Fjalla One": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Fjord One": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Flamenco": {
				"category": "display",
				"variants": "300,400",
				"subsets": "latin"
			},
			"Flavors": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Fondamento": {
				"category": "handwriting",
				"variants": "400,400i",
				"subsets": "latin,latin-ext"
			},
			"Fontdiner Swanky": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Forum": {
				"category": "display",
				"variants": "400",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext"
			},
			"Francois One": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Frank Ruhl Libre": {
				"category": "serif",
				"variants": "300,400,500,700,900",
				"subsets": "hebrew,latin,latin-ext"
			},
			"Freckle Face": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Fredericka the Great": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Fredoka One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Freehand": {
				"category": "display",
				"variants": "400",
				"subsets": "khmer"
			},
			"Fresca": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Frijole": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Fruktur": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Fugaz One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"GFS Didot": {
				"category": "serif",
				"variants": "400",
				"subsets": "greek"
			},
			"GFS Neohellenic": {
				"category": "sans-serif",
				"variants": "400,400i,700,700i",
				"subsets": "greek"
			},
			"Gabriela": {
				"category": "serif",
				"variants": "400",
				"subsets": "cyrillic,cyrillic-ext,latin"
			},
			"Gaegu": {
				"category": "handwriting",
				"variants": "300,400,700",
				"subsets": "korean,latin"
			},
			"Gafata": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Galada": {
				"category": "display",
				"variants": "400",
				"subsets": "bengali,latin"
			},
			"Galdeano": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Galindo": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Gamja Flower": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "korean,latin"
			},
			"Gayathri": {
				"category": "sans-serif",
				"variants": "100,400,700",
				"subsets": "latin,malayalam"
			},
			"Gelasio": {
				"category": "serif",
				"variants": "400,400i,500,500i,600,600i,700,700i",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Gentium Basic": {
				"category": "serif",
				"variants": "400,400i,700,700i",
				"subsets": "latin,latin-ext"
			},
			"Gentium Book Basic": {
				"category": "serif",
				"variants": "400,400i,700,700i",
				"subsets": "latin,latin-ext"
			},
			"Geo": {
				"category": "sans-serif",
				"variants": "400,400i",
				"subsets": "latin"
			},
			"Geostar": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Geostar Fill": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Germania One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Gidugu": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,telugu"
			},
			"Gilda Display": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Girassol": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Give You Glory": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Glass Antiqua": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Glegoo": {
				"category": "serif",
				"variants": "400,700",
				"subsets": "devanagari,latin,latin-ext"
			},
			"Gloria Hallelujah": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Goblin One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Gochi Hand": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Goldman": {
				"category": "display",
				"variants": "400,700",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Gorditas": {
				"category": "display",
				"variants": "400,700",
				"subsets": "latin"
			},
			"Gothic A1": {
				"category": "sans-serif",
				"variants": "100,200,300,400,500,600,700,800,900",
				"subsets": "korean,latin"
			},
			"Gotu": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "devanagari,latin,latin-ext,vietnamese"
			},
			"Goudy Bookletter 1911": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Graduate": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Grand Hotel": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Grandstander": {
				"category": "display",
				"variants": "100,200,300,400,500,600,700,800,900,100i,200i,300i,400i,500i,600i,700i,800i,900i",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Gravitas One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Great Vibes": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Grenze": {
				"category": "serif",
				"variants": "100,100i,200,200i,300,300i,400,400i,500,500i,600,600i,700,700i,800,800i,900,900i",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Grenze Gotisch": {
				"category": "display",
				"variants": "100,200,300,400,500,600,700,800,900",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Griffy": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Gruppo": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Gudea": {
				"category": "sans-serif",
				"variants": "400,400i,700",
				"subsets": "latin,latin-ext"
			},
			"Gugi": {
				"category": "display",
				"variants": "400",
				"subsets": "korean,latin"
			},
			"Gupter": {
				"category": "serif",
				"variants": "400,500,700",
				"subsets": "latin"
			},
			"Gurajada": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin,telugu"
			},
			"Habibi": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Halant": {
				"category": "serif",
				"variants": "300,400,500,600,700",
				"subsets": "devanagari,latin,latin-ext"
			},
			"Hammersmith One": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Hanalei": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Hanalei Fill": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Handlee": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Hanuman": {
				"category": "serif",
				"variants": "400,700",
				"subsets": "khmer"
			},
			"Happy Monkey": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Harmattan": {
				"category": "sans-serif",
				"variants": "400,700",
				"subsets": "arabic,latin,latin-ext"
			},
			"Headland One": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Heebo": {
				"category": "sans-serif",
				"variants": "100,200,300,400,500,600,700,800,900",
				"subsets": "hebrew,latin"
			},
			"Henny Penny": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Hepta Slab": {
				"category": "serif",
				"variants": "100,200,300,400,500,600,700,800,900",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Herr Von Muellerhoff": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Hi Melody": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "korean,latin"
			},
			"Hind": {
				"category": "sans-serif",
				"variants": "300,400,500,600,700",
				"subsets": "devanagari,latin,latin-ext"
			},
			"Hind Guntur": {
				"category": "sans-serif",
				"variants": "300,400,500,600,700",
				"subsets": "latin,latin-ext,telugu"
			},
			"Hind Madurai": {
				"category": "sans-serif",
				"variants": "300,400,500,600,700",
				"subsets": "latin,latin-ext,tamil"
			},
			"Hind Siliguri": {
				"category": "sans-serif",
				"variants": "300,400,500,600,700",
				"subsets": "bengali,latin,latin-ext"
			},
			"Hind Vadodara": {
				"category": "sans-serif",
				"variants": "300,400,500,600,700",
				"subsets": "gujarati,latin,latin-ext"
			},
			"Holtwood One SC": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Homemade Apple": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Homenaje": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin"
			},
			"IBM Plex Mono": {
				"category": "monospace",
				"variants": "100,100i,200,200i,300,300i,400,400i,500,500i,600,600i,700,700i",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext,vietnamese"
			},
			"IBM Plex Sans": {
				"category": "sans-serif",
				"variants": "100,100i,200,200i,300,300i,400,400i,500,500i,600,600i,700,700i",
				"subsets": "cyrillic,cyrillic-ext,greek,latin,latin-ext,vietnamese"
			},
			"IBM Plex Sans Condensed": {
				"category": "sans-serif",
				"variants": "100,100i,200,200i,300,300i,400,400i,500,500i,600,600i,700,700i",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"IBM Plex Serif": {
				"category": "serif",
				"variants": "100,100i,200,200i,300,300i,400,400i,500,500i,600,600i,700,700i",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext,vietnamese"
			},
			"IM Fell DW Pica": {
				"category": "serif",
				"variants": "400,400i",
				"subsets": "latin"
			},
			"IM Fell DW Pica SC": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin"
			},
			"IM Fell Double Pica": {
				"category": "serif",
				"variants": "400,400i",
				"subsets": "latin"
			},
			"IM Fell Double Pica SC": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin"
			},
			"IM Fell English": {
				"category": "serif",
				"variants": "400,400i",
				"subsets": "latin"
			},
			"IM Fell English SC": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin"
			},
			"IM Fell French Canon": {
				"category": "serif",
				"variants": "400,400i",
				"subsets": "latin"
			},
			"IM Fell French Canon SC": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin"
			},
			"IM Fell Great Primer": {
				"category": "serif",
				"variants": "400,400i",
				"subsets": "latin"
			},
			"IM Fell Great Primer SC": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Ibarra Real Nova": {
				"category": "serif",
				"variants": "400,500,600,700,400i,500i,600i,700i",
				"subsets": "latin,latin-ext"
			},
			"Iceberg": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Iceland": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Imprima": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Inconsolata": {
				"category": "monospace",
				"variants": "200,300,400,500,600,700,800,900",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Inder": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Indie Flower": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Inika": {
				"category": "serif",
				"variants": "400,700",
				"subsets": "latin,latin-ext"
			},
			"Inknut Antiqua": {
				"category": "serif",
				"variants": "300,400,500,600,700,800,900",
				"subsets": "devanagari,latin,latin-ext"
			},
			"Inria Sans": {
				"category": "sans-serif",
				"variants": "300,300i,400,400i,700,700i",
				"subsets": "latin,latin-ext"
			},
			"Inria Serif": {
				"category": "serif",
				"variants": "300,300i,400,400i,700,700i",
				"subsets": "latin,latin-ext"
			},
			"Inter": {
				"category": "sans-serif",
				"variants": "100,200,300,400,500,600,700,800,900",
				"subsets": "cyrillic,cyrillic-ext,greek,greek-ext,latin,latin-ext,vietnamese"
			},
			"Irish Grover": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Istok Web": {
				"category": "sans-serif",
				"variants": "400,400i,700,700i",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext"
			},
			"Italiana": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Italianno": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Itim": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext,thai,vietnamese"
			},
			"Jacques Francois": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Jacques Francois Shadow": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Jaldi": {
				"category": "sans-serif",
				"variants": "400,700",
				"subsets": "devanagari,latin,latin-ext"
			},
			"JetBrains Mono": {
				"category": "monospace",
				"variants": "100,200,300,400,500,600,700,800,100i,200i,300i,400i,500i,600i,700i,800i",
				"subsets": "cyrillic,cyrillic-ext,greek,latin,latin-ext,vietnamese"
			},
			"Jim Nightshade": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Jockey One": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Jolly Lodger": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Jomhuria": {
				"category": "display",
				"variants": "400",
				"subsets": "arabic,latin,latin-ext"
			},
			"Jomolhari": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin,tibetan"
			},
			"Josefin Sans": {
				"category": "sans-serif",
				"variants": "100,200,300,400,500,600,700,100i,200i,300i,400i,500i,600i,700i",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Josefin Slab": {
				"category": "serif",
				"variants": "100,200,300,400,500,600,700,100i,200i,300i,400i,500i,600i,700i",
				"subsets": "latin"
			},
			"Jost": {
				"category": "sans-serif",
				"variants": "100,200,300,400,500,600,700,800,900,100i,200i,300i,400i,500i,600i,700i,800i,900i",
				"subsets": "cyrillic,latin,latin-ext"
			},
			"Joti One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Jua": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "korean,latin"
			},
			"Judson": {
				"category": "serif",
				"variants": "400,400i,700",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Julee": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Julius Sans One": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Junge": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Jura": {
				"category": "sans-serif",
				"variants": "300,400,500,600,700",
				"subsets": "cyrillic,cyrillic-ext,greek,greek-ext,latin,latin-ext,vietnamese"
			},
			"Just Another Hand": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Just Me Again Down Here": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"K2D": {
				"category": "sans-serif",
				"variants": "100,100i,200,200i,300,300i,400,400i,500,500i,600,600i,700,700i,800,800i",
				"subsets": "latin,latin-ext,thai,vietnamese"
			},
			"Kadwa": {
				"category": "serif",
				"variants": "400,700",
				"subsets": "devanagari,latin"
			},
			"Kalam": {
				"category": "handwriting",
				"variants": "300,400,700",
				"subsets": "devanagari,latin,latin-ext"
			},
			"Kameron": {
				"category": "serif",
				"variants": "400,700",
				"subsets": "latin"
			},
			"Kanit": {
				"category": "sans-serif",
				"variants": "100,100i,200,200i,300,300i,400,400i,500,500i,600,600i,700,700i,800,800i,900,900i",
				"subsets": "latin,latin-ext,thai,vietnamese"
			},
			"Kantumruy": {
				"category": "sans-serif",
				"variants": "300,400,700",
				"subsets": "khmer"
			},
			"Karla": {
				"category": "sans-serif",
				"variants": "200,300,400,500,600,700,800,200i,300i,400i,500i,600i,700i,800i",
				"subsets": "latin,latin-ext"
			},
			"Karma": {
				"category": "serif",
				"variants": "300,400,500,600,700",
				"subsets": "devanagari,latin,latin-ext"
			},
			"Katibeh": {
				"category": "display",
				"variants": "400",
				"subsets": "arabic,latin,latin-ext"
			},
			"Kaushan Script": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Kavivanar": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext,tamil"
			},
			"Kavoon": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Kdam Thmor": {
				"category": "display",
				"variants": "400",
				"subsets": "khmer"
			},
			"Keania One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Kelly Slab": {
				"category": "display",
				"variants": "400",
				"subsets": "cyrillic,latin,latin-ext"
			},
			"Kenia": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Khand": {
				"category": "sans-serif",
				"variants": "300,400,500,600,700",
				"subsets": "devanagari,latin,latin-ext"
			},
			"Khmer": {
				"category": "display",
				"variants": "400",
				"subsets": "khmer"
			},
			"Khula": {
				"category": "sans-serif",
				"variants": "300,400,600,700,800",
				"subsets": "devanagari,latin,latin-ext"
			},
			"Kirang Haerang": {
				"category": "display",
				"variants": "400",
				"subsets": "korean,latin"
			},
			"Kite One": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Knewave": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"KoHo": {
				"category": "sans-serif",
				"variants": "200,200i,300,300i,400,400i,500,500i,600,600i,700,700i",
				"subsets": "latin,latin-ext,thai,vietnamese"
			},
			"Kodchasan": {
				"category": "sans-serif",
				"variants": "200,200i,300,300i,400,400i,500,500i,600,600i,700,700i",
				"subsets": "latin,latin-ext,thai,vietnamese"
			},
			"Kosugi": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "cyrillic,japanese,latin"
			},
			"Kosugi Maru": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "cyrillic,japanese,latin"
			},
			"Kotta One": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Koulen": {
				"category": "display",
				"variants": "400",
				"subsets": "khmer"
			},
			"Kranky": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Kreon": {
				"category": "serif",
				"variants": "300,400,500,600,700",
				"subsets": "latin,latin-ext"
			},
			"Kristi": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Krona One": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Krub": {
				"category": "sans-serif",
				"variants": "200,200i,300,300i,400,400i,500,500i,600,600i,700,700i",
				"subsets": "latin,latin-ext,thai,vietnamese"
			},
			"Kufam": {
				"category": "display",
				"variants": "400,500,600,700,800,900,400i,500i,600i,700i,800i,900i",
				"subsets": "arabic,latin,latin-ext,vietnamese"
			},
			"Kulim Park": {
				"category": "sans-serif",
				"variants": "200,200i,300,300i,400,400i,600,600i,700,700i",
				"subsets": "latin,latin-ext"
			},
			"Kumar One": {
				"category": "display",
				"variants": "400",
				"subsets": "gujarati,latin,latin-ext"
			},
			"Kumar One Outline": {
				"category": "display",
				"variants": "400",
				"subsets": "gujarati,latin,latin-ext"
			},
			"Kumbh Sans": {
				"category": "sans-serif",
				"variants": "300,400,700",
				"subsets": "latin,latin-ext"
			},
			"Kurale": {
				"category": "serif",
				"variants": "400",
				"subsets": "cyrillic,cyrillic-ext,devanagari,latin,latin-ext"
			},
			"La Belle Aurore": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Lacquer": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Laila": {
				"category": "serif",
				"variants": "300,400,500,600,700",
				"subsets": "devanagari,latin,latin-ext"
			},
			"Lakki Reddy": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,telugu"
			},
			"Lalezar": {
				"category": "display",
				"variants": "400",
				"subsets": "arabic,latin,latin-ext,vietnamese"
			},
			"Lancelot": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Langar": {
				"category": "display",
				"variants": "400",
				"subsets": "gurmukhi,latin,latin-ext"
			},
			"Lateef": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "arabic,latin"
			},
			"Lato": {
				"category": "sans-serif",
				"variants": "100,100i,300,300i,400,400i,700,700i,900,900i",
				"subsets": "latin,latin-ext"
			},
			"League Script": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Leckerli One": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Ledger": {
				"category": "serif",
				"variants": "400",
				"subsets": "cyrillic,latin,latin-ext"
			},
			"Lekton": {
				"category": "sans-serif",
				"variants": "400,400i,700",
				"subsets": "latin,latin-ext"
			},
			"Lemon": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Lemonada": {
				"category": "display",
				"variants": "300,400,500,600,700",
				"subsets": "arabic,latin,latin-ext,vietnamese"
			},
			"Lexend Deca": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Lexend Exa": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Lexend Giga": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Lexend Mega": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Lexend Peta": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Lexend Tera": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Lexend Zetta": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Libre Barcode 128": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Libre Barcode 128 Text": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Libre Barcode 39": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Libre Barcode 39 Extended": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Libre Barcode 39 Extended Text": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Libre Barcode 39 Text": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Libre Barcode EAN13 Text": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Libre Baskerville": {
				"category": "serif",
				"variants": "400,400i,700",
				"subsets": "latin,latin-ext"
			},
			"Libre Caslon Display": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Libre Caslon Text": {
				"category": "serif",
				"variants": "400,400i,700",
				"subsets": "latin,latin-ext"
			},
			"Libre Franklin": {
				"category": "sans-serif",
				"variants": "100,200,300,400,500,600,700,800,900,100i,200i,300i,400i,500i,600i,700i,800i,900i",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Life Savers": {
				"category": "display",
				"variants": "400,700,800",
				"subsets": "latin,latin-ext"
			},
			"Lilita One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Lily Script One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Limelight": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Linden Hill": {
				"category": "serif",
				"variants": "400,400i",
				"subsets": "latin"
			},
			"Literata": {
				"category": "serif",
				"variants": "200,300,400,500,600,700,800,900,200i,300i,400i,500i,600i,700i,800i,900i",
				"subsets": "cyrillic,cyrillic-ext,greek,greek-ext,latin,latin-ext,vietnamese"
			},
			"Liu Jian Mao Cao": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "chinese-simplified,latin"
			},
			"Livvic": {
				"category": "sans-serif",
				"variants": "100,100i,200,200i,300,300i,400,400i,500,500i,600,600i,700,700i,900,900i",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Lobster": {
				"category": "display",
				"variants": "400",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext,vietnamese"
			},
			"Lobster Two": {
				"category": "display",
				"variants": "400,400i,700,700i",
				"subsets": "latin"
			},
			"Londrina Outline": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Londrina Shadow": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Londrina Sketch": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Londrina Solid": {
				"category": "display",
				"variants": "100,300,400,900",
				"subsets": "latin"
			},
			"Long Cang": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "chinese-simplified,latin"
			},
			"Lora": {
				"category": "serif",
				"variants": "400,500,600,700,400i,500i,600i,700i",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext,vietnamese"
			},
			"Love Ya Like A Sister": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Loved by the King": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Lovers Quarrel": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Luckiest Guy": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Lusitana": {
				"category": "serif",
				"variants": "400,700",
				"subsets": "latin"
			},
			"Lustria": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin"
			},
			"M PLUS 1p": {
				"category": "sans-serif",
				"variants": "100,300,400,500,700,800,900",
				"subsets": "cyrillic,cyrillic-ext,greek,greek-ext,hebrew,japanese,latin,latin-ext,vietnamese"
			},
			"M PLUS Rounded 1c": {
				"category": "sans-serif",
				"variants": "100,300,400,500,700,800,900",
				"subsets": "cyrillic,cyrillic-ext,greek,greek-ext,hebrew,japanese,latin,latin-ext,vietnamese"
			},
			"Ma Shan Zheng": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "chinese-simplified,latin"
			},
			"Macondo": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Macondo Swash Caps": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Mada": {
				"category": "sans-serif",
				"variants": "200,300,400,500,600,700,900",
				"subsets": "arabic,latin"
			},
			"Magra": {
				"category": "sans-serif",
				"variants": "400,700",
				"subsets": "latin,latin-ext"
			},
			"Maiden Orange": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Maitree": {
				"category": "serif",
				"variants": "200,300,400,500,600,700",
				"subsets": "latin,latin-ext,thai,vietnamese"
			},
			"Major Mono Display": {
				"category": "monospace",
				"variants": "400",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Mako": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Mali": {
				"category": "handwriting",
				"variants": "200,200i,300,300i,400,400i,500,500i,600,600i,700,700i",
				"subsets": "latin,latin-ext,thai,vietnamese"
			},
			"Mallanna": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,telugu"
			},
			"Mandali": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,telugu"
			},
			"Manjari": {
				"category": "sans-serif",
				"variants": "100,400,700",
				"subsets": "latin,malayalam"
			},
			"Manrope": {
				"category": "sans-serif",
				"variants": "200,300,400,500,600,700,800",
				"subsets": "cyrillic,greek,latin,latin-ext"
			},
			"Mansalva": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Manuale": {
				"category": "serif",
				"variants": "400,500,600,700,400i,500i,600i,700i",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Marcellus": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Marcellus SC": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Marck Script": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "cyrillic,latin,latin-ext"
			},
			"Margarine": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Markazi Text": {
				"category": "serif",
				"variants": "400,500,600,700",
				"subsets": "arabic,latin,latin-ext,vietnamese"
			},
			"Marko One": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Marmelad": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "cyrillic,latin,latin-ext"
			},
			"Martel": {
				"category": "serif",
				"variants": "200,300,400,600,700,800,900",
				"subsets": "devanagari,latin,latin-ext"
			},
			"Martel Sans": {
				"category": "sans-serif",
				"variants": "200,300,400,600,700,800,900",
				"subsets": "devanagari,latin,latin-ext"
			},
			"Marvel": {
				"category": "sans-serif",
				"variants": "400,400i,700,700i",
				"subsets": "latin"
			},
			"Mate": {
				"category": "serif",
				"variants": "400,400i",
				"subsets": "latin"
			},
			"Mate SC": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Maven Pro": {
				"category": "sans-serif",
				"variants": "400,500,600,700,800,900",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"McLaren": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Meddon": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"MedievalSharp": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Medula One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Meera Inimai": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,tamil"
			},
			"Megrim": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Meie Script": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Merienda": {
				"category": "handwriting",
				"variants": "400,700",
				"subsets": "latin,latin-ext"
			},
			"Merienda One": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Merriweather": {
				"category": "serif",
				"variants": "300,300i,400,400i,700,700i,900,900i",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext,vietnamese"
			},
			"Merriweather Sans": {
				"category": "sans-serif",
				"variants": "300,400,500,600,700,800,300i,400i,500i,600i,700i,800i",
				"subsets": "cyrillic-ext,latin,latin-ext,vietnamese"
			},
			"Metal": {
				"category": "display",
				"variants": "400",
				"subsets": "khmer"
			},
			"Metal Mania": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Metamorphous": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Metrophobic": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Michroma": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Milonga": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Miltonian": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Miltonian Tattoo": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Mina": {
				"category": "sans-serif",
				"variants": "400,700",
				"subsets": "bengali,latin,latin-ext"
			},
			"Miniver": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Miriam Libre": {
				"category": "sans-serif",
				"variants": "400,700",
				"subsets": "hebrew,latin,latin-ext"
			},
			"Mirza": {
				"category": "display",
				"variants": "400,500,600,700",
				"subsets": "arabic,latin,latin-ext"
			},
			"Miss Fajardose": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Mitr": {
				"category": "sans-serif",
				"variants": "200,300,400,500,600,700",
				"subsets": "latin,latin-ext,thai,vietnamese"
			},
			"Modak": {
				"category": "display",
				"variants": "400",
				"subsets": "devanagari,latin,latin-ext"
			},
			"Modern Antiqua": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Mogra": {
				"category": "display",
				"variants": "400",
				"subsets": "gujarati,latin,latin-ext"
			},
			"Molengo": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Molle": {
				"category": "handwriting",
				"variants": "400i",
				"subsets": "latin,latin-ext"
			},
			"Monda": {
				"category": "sans-serif",
				"variants": "400,700",
				"subsets": "latin,latin-ext"
			},
			"Monofett": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Monoton": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Monsieur La Doulaise": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Montaga": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Montez": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Montserrat": {
				"category": "sans-serif",
				"variants": "100,100i,200,200i,300,300i,400,400i,500,500i,600,600i,700,700i,800,800i,900,900i",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext,vietnamese"
			},
			"Montserrat Alternates": {
				"category": "sans-serif",
				"variants": "100,100i,200,200i,300,300i,400,400i,500,500i,600,600i,700,700i,800,800i,900,900i",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext,vietnamese"
			},
			"Montserrat Subrayada": {
				"category": "sans-serif",
				"variants": "400,700",
				"subsets": "latin"
			},
			"Moul": {
				"category": "display",
				"variants": "400",
				"subsets": "khmer"
			},
			"Moulpali": {
				"category": "display",
				"variants": "400",
				"subsets": "khmer"
			},
			"Mountains of Christmas": {
				"category": "display",
				"variants": "400,700",
				"subsets": "latin"
			},
			"Mouse Memoirs": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Mr Bedfort": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Mr Dafoe": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Mr De Haviland": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Mrs Saint Delafield": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Mrs Sheppards": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Mukta": {
				"category": "sans-serif",
				"variants": "200,300,400,500,600,700,800",
				"subsets": "devanagari,latin,latin-ext"
			},
			"Mukta Mahee": {
				"category": "sans-serif",
				"variants": "200,300,400,500,600,700,800",
				"subsets": "gurmukhi,latin,latin-ext"
			},
			"Mukta Malar": {
				"category": "sans-serif",
				"variants": "200,300,400,500,600,700,800",
				"subsets": "latin,latin-ext,tamil"
			},
			"Mukta Vaani": {
				"category": "sans-serif",
				"variants": "200,300,400,500,600,700,800",
				"subsets": "gujarati,latin,latin-ext"
			},
			"Mulish": {
				"category": "sans-serif",
				"variants": "200,300,400,500,600,700,800,900,200i,300i,400i,500i,600i,700i,800i,900i",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"MuseoModerno": {
				"category": "display",
				"variants": "100,200,300,400,500,600,700,800,900",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Mystery Quest": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"NTR": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,telugu"
			},
			"Nanum Brush Script": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "korean,latin"
			},
			"Nanum Gothic": {
				"category": "sans-serif",
				"variants": "400,700,800",
				"subsets": "korean,latin"
			},
			"Nanum Gothic Coding": {
				"category": "monospace",
				"variants": "400,700",
				"subsets": "korean,latin"
			},
			"Nanum Myeongjo": {
				"category": "serif",
				"variants": "400,700,800",
				"subsets": "korean,latin"
			},
			"Nanum Pen Script": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "korean,latin"
			},
			"Nerko One": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Neucha": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "cyrillic,latin"
			},
			"Neuton": {
				"category": "serif",
				"variants": "200,300,400,400i,700,800",
				"subsets": "latin,latin-ext"
			},
			"New Rocker": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"News Cycle": {
				"category": "sans-serif",
				"variants": "400,700",
				"subsets": "latin,latin-ext"
			},
			"Niconne": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Niramit": {
				"category": "sans-serif",
				"variants": "200,200i,300,300i,400,400i,500,500i,600,600i,700,700i",
				"subsets": "latin,latin-ext,thai,vietnamese"
			},
			"Nixie One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Nobile": {
				"category": "sans-serif",
				"variants": "400,400i,500,500i,700,700i",
				"subsets": "latin,latin-ext"
			},
			"Nokora": {
				"category": "serif",
				"variants": "400,700",
				"subsets": "khmer"
			},
			"Norican": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Nosifer": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Notable": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Nothing You Could Do": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Noticia Text": {
				"category": "serif",
				"variants": "400,400i,700,700i",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Noto Sans": {
				"category": "sans-serif",
				"variants": "400,400i,700,700i",
				"subsets": "cyrillic,cyrillic-ext,devanagari,greek,greek-ext,latin,latin-ext,vietnamese"
			},
			"Noto Sans HK": {
				"category": "sans-serif",
				"variants": "100,300,400,500,700,900",
				"subsets": "chinese-hongkong,latin"
			},
			"Noto Sans JP": {
				"category": "sans-serif",
				"variants": "100,300,400,500,700,900",
				"subsets": "japanese,latin"
			},
			"Noto Sans KR": {
				"category": "sans-serif",
				"variants": "100,300,400,500,700,900",
				"subsets": "korean,latin"
			},
			"Noto Sans SC": {
				"category": "sans-serif",
				"variants": "100,300,400,500,700,900",
				"subsets": "chinese-simplified,latin"
			},
			"Noto Sans TC": {
				"category": "sans-serif",
				"variants": "100,300,400,500,700,900",
				"subsets": "chinese-traditional,latin"
			},
			"Noto Serif": {
				"category": "serif",
				"variants": "400,400i,700,700i",
				"subsets": "cyrillic,cyrillic-ext,greek,greek-ext,latin,latin-ext,vietnamese"
			},
			"Noto Serif JP": {
				"category": "serif",
				"variants": "200,300,400,500,600,700,900",
				"subsets": "japanese,latin"
			},
			"Noto Serif KR": {
				"category": "serif",
				"variants": "200,300,400,500,600,700,900",
				"subsets": "korean,latin"
			},
			"Noto Serif SC": {
				"category": "serif",
				"variants": "200,300,400,500,600,700,900",
				"subsets": "chinese-simplified,latin"
			},
			"Noto Serif TC": {
				"category": "serif",
				"variants": "200,300,400,500,600,700,900",
				"subsets": "chinese-traditional,latin"
			},
			"Nova Cut": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Nova Flat": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Nova Mono": {
				"category": "monospace",
				"variants": "400",
				"subsets": "greek,latin"
			},
			"Nova Oval": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Nova Round": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Nova Script": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Nova Slim": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Nova Square": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Numans": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Nunito": {
				"category": "sans-serif",
				"variants": "200,200i,300,300i,400,400i,600,600i,700,700i,800,800i,900,900i",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext,vietnamese"
			},
			"Nunito Sans": {
				"category": "sans-serif",
				"variants": "200,200i,300,300i,400,400i,600,600i,700,700i,800,800i,900,900i",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Odibee Sans": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Odor Mean Chey": {
				"category": "display",
				"variants": "400",
				"subsets": "khmer"
			},
			"Offside": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Old Standard TT": {
				"category": "serif",
				"variants": "400,400i,700",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext,vietnamese"
			},
			"Oldenburg": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Oleo Script": {
				"category": "display",
				"variants": "400,700",
				"subsets": "latin,latin-ext"
			},
			"Oleo Script Swash Caps": {
				"category": "display",
				"variants": "400,700",
				"subsets": "latin,latin-ext"
			},
			"Open Sans": {
				"category": "sans-serif",
				"variants": "300,300i,400,400i,600,600i,700,700i,800,800i",
				"subsets": "cyrillic,cyrillic-ext,greek,greek-ext,latin,latin-ext,vietnamese"
			},
			"Open Sans Condensed": {
				"category": "sans-serif",
				"variants": "300,300i,700",
				"subsets": "cyrillic,cyrillic-ext,greek,greek-ext,latin,latin-ext,vietnamese"
			},
			"Oranienbaum": {
				"category": "serif",
				"variants": "400",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext"
			},
			"Orbitron": {
				"category": "sans-serif",
				"variants": "400,500,600,700,800,900",
				"subsets": "latin"
			},
			"Oregano": {
				"category": "display",
				"variants": "400,400i",
				"subsets": "latin,latin-ext"
			},
			"Orienta": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Original Surfer": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Oswald": {
				"category": "sans-serif",
				"variants": "200,300,400,500,600,700",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext,vietnamese"
			},
			"Over the Rainbow": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Overlock": {
				"category": "display",
				"variants": "400,400i,700,700i,900,900i",
				"subsets": "latin,latin-ext"
			},
			"Overlock SC": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Overpass": {
				"category": "sans-serif",
				"variants": "100,100i,200,200i,300,300i,400,400i,600,600i,700,700i,800,800i,900,900i",
				"subsets": "latin,latin-ext"
			},
			"Overpass Mono": {
				"category": "monospace",
				"variants": "300,400,600,700",
				"subsets": "latin,latin-ext"
			},
			"Ovo": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Oxanium": {
				"category": "display",
				"variants": "200,300,400,500,600,700,800",
				"subsets": "latin,latin-ext"
			},
			"Oxygen": {
				"category": "sans-serif",
				"variants": "300,400,700",
				"subsets": "latin,latin-ext"
			},
			"Oxygen Mono": {
				"category": "monospace",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"PT Mono": {
				"category": "monospace",
				"variants": "400",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext"
			},
			"PT Sans": {
				"category": "sans-serif",
				"variants": "400,400i,700,700i",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext"
			},
			"PT Sans Caption": {
				"category": "sans-serif",
				"variants": "400,700",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext"
			},
			"PT Sans Narrow": {
				"category": "sans-serif",
				"variants": "400,700",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext"
			},
			"PT Serif": {
				"category": "serif",
				"variants": "400,400i,700,700i",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext"
			},
			"PT Serif Caption": {
				"category": "serif",
				"variants": "400,400i",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext"
			},
			"Pacifico": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext,vietnamese"
			},
			"Padauk": {
				"category": "sans-serif",
				"variants": "400,700",
				"subsets": "latin,myanmar"
			},
			"Palanquin": {
				"category": "sans-serif",
				"variants": "100,200,300,400,500,600,700",
				"subsets": "devanagari,latin,latin-ext"
			},
			"Palanquin Dark": {
				"category": "sans-serif",
				"variants": "400,500,600,700",
				"subsets": "devanagari,latin,latin-ext"
			},
			"Pangolin": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext,vietnamese"
			},
			"Paprika": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Parisienne": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Passero One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Passion One": {
				"category": "display",
				"variants": "400,700,900",
				"subsets": "latin,latin-ext"
			},
			"Pathway Gothic One": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Patrick Hand": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Patrick Hand SC": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Pattaya": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "cyrillic,latin,latin-ext,thai,vietnamese"
			},
			"Patua One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Pavanam": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext,tamil"
			},
			"Paytone One": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Peddana": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin,telugu"
			},
			"Peralta": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Permanent Marker": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Petit Formal Script": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Petrona": {
				"category": "serif",
				"variants": "100,200,300,400,500,600,700,800,900,100i,200i,300i,400i,500i,600i,700i,800i,900i",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Philosopher": {
				"category": "sans-serif",
				"variants": "400,400i,700,700i",
				"subsets": "cyrillic,cyrillic-ext,latin,vietnamese"
			},
			"Piazzolla": {
				"category": "serif",
				"variants": "100,200,300,400,500,600,700,800,900,100i,200i,300i,400i,500i,600i,700i,800i,900i",
				"subsets": "cyrillic,cyrillic-ext,greek,greek-ext,latin,latin-ext,vietnamese"
			},
			"Piedra": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Pinyon Script": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Pirata One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Plaster": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Play": {
				"category": "sans-serif",
				"variants": "400,700",
				"subsets": "cyrillic,cyrillic-ext,greek,latin,latin-ext,vietnamese"
			},
			"Playball": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Playfair Display": {
				"category": "serif",
				"variants": "400,500,600,700,800,900,400i,500i,600i,700i,800i,900i",
				"subsets": "cyrillic,latin,latin-ext,vietnamese"
			},
			"Playfair Display SC": {
				"category": "serif",
				"variants": "400,400i,700,700i,900,900i",
				"subsets": "cyrillic,latin,latin-ext,vietnamese"
			},
			"Podkova": {
				"category": "serif",
				"variants": "400,500,600,700,800",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext,vietnamese"
			},
			"Poiret One": {
				"category": "display",
				"variants": "400",
				"subsets": "cyrillic,latin,latin-ext"
			},
			"Poller One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Poly": {
				"category": "serif",
				"variants": "400,400i",
				"subsets": "latin"
			},
			"Pompiere": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Pontano Sans": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Poor Story": {
				"category": "display",
				"variants": "400",
				"subsets": "korean,latin"
			},
			"Poppins": {
				"category": "sans-serif",
				"variants": "100,100i,200,200i,300,300i,400,400i,500,500i,600,600i,700,700i,800,800i,900,900i",
				"subsets": "devanagari,latin,latin-ext"
			},
			"Port Lligat Sans": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Port Lligat Slab": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Pragati Narrow": {
				"category": "sans-serif",
				"variants": "400,700",
				"subsets": "devanagari,latin,latin-ext"
			},
			"Prata": {
				"category": "serif",
				"variants": "400",
				"subsets": "cyrillic,cyrillic-ext,latin,vietnamese"
			},
			"Preahvihear": {
				"category": "display",
				"variants": "400",
				"subsets": "khmer"
			},
			"Press Start 2P": {
				"category": "display",
				"variants": "400",
				"subsets": "cyrillic,cyrillic-ext,greek,latin,latin-ext"
			},
			"Pridi": {
				"category": "serif",
				"variants": "200,300,400,500,600,700",
				"subsets": "latin,latin-ext,thai,vietnamese"
			},
			"Princess Sofia": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Prociono": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Prompt": {
				"category": "sans-serif",
				"variants": "100,100i,200,200i,300,300i,400,400i,500,500i,600,600i,700,700i,800,800i,900,900i",
				"subsets": "latin,latin-ext,thai,vietnamese"
			},
			"Prosto One": {
				"category": "display",
				"variants": "400",
				"subsets": "cyrillic,latin,latin-ext"
			},
			"Proza Libre": {
				"category": "sans-serif",
				"variants": "400,400i,500,500i,600,600i,700,700i,800,800i",
				"subsets": "latin,latin-ext"
			},
			"Public Sans": {
				"category": "sans-serif",
				"variants": "100,200,300,400,500,600,700,800,900,100i,200i,300i,400i,500i,600i,700i,800i,900i",
				"subsets": "latin,latin-ext"
			},
			"Puritan": {
				"category": "sans-serif",
				"variants": "400,400i,700,700i",
				"subsets": "latin"
			},
			"Purple Purse": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Quando": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Quantico": {
				"category": "sans-serif",
				"variants": "400,400i,700,700i",
				"subsets": "latin"
			},
			"Quattrocento": {
				"category": "serif",
				"variants": "400,700",
				"subsets": "latin,latin-ext"
			},
			"Quattrocento Sans": {
				"category": "sans-serif",
				"variants": "400,400i,700,700i",
				"subsets": "latin,latin-ext"
			},
			"Questrial": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Quicksand": {
				"category": "sans-serif",
				"variants": "300,400,500,600,700",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Quintessential": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Qwigley": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Racing Sans One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Radley": {
				"category": "serif",
				"variants": "400,400i",
				"subsets": "latin,latin-ext"
			},
			"Rajdhani": {
				"category": "sans-serif",
				"variants": "300,400,500,600,700",
				"subsets": "devanagari,latin,latin-ext"
			},
			"Rakkas": {
				"category": "display",
				"variants": "400",
				"subsets": "arabic,latin,latin-ext"
			},
			"Raleway": {
				"category": "sans-serif",
				"variants": "100,200,300,400,500,600,700,800,900,100i,200i,300i,400i,500i,600i,700i,800i,900i",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext,vietnamese"
			},
			"Raleway Dots": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Ramabhadra": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,telugu"
			},
			"Ramaraja": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin,telugu"
			},
			"Rambla": {
				"category": "sans-serif",
				"variants": "400,400i,700,700i",
				"subsets": "latin,latin-ext"
			},
			"Rammetto One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Ranchers": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Rancho": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Ranga": {
				"category": "display",
				"variants": "400,700",
				"subsets": "devanagari,latin,latin-ext"
			},
			"Rasa": {
				"category": "serif",
				"variants": "300,400,500,600,700",
				"subsets": "gujarati,latin,latin-ext"
			},
			"Rationale": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Ravi Prakash": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,telugu"
			},
			"Recursive": {
				"category": "sans-serif",
				"variants": "300,400,500,600,700,800,900",
				"subsets": "latin,vietnamese"
			},
			"Red Hat Display": {
				"category": "sans-serif",
				"variants": "400,400i,500,500i,700,700i,900,900i",
				"subsets": "latin,latin-ext"
			},
			"Red Hat Text": {
				"category": "sans-serif",
				"variants": "400,400i,500,500i,700,700i",
				"subsets": "latin,latin-ext"
			},
			"Red Rose": {
				"category": "display",
				"variants": "300,400,500,600,700",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Redressed": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Reem Kufi": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "arabic,latin"
			},
			"Reenie Beanie": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Revalia": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Rhodium Libre": {
				"category": "serif",
				"variants": "400",
				"subsets": "devanagari,latin,latin-ext"
			},
			"Ribeye": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Ribeye Marrow": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Righteous": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Risque": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Roboto": {
				"category": "sans-serif",
				"variants": "100,100i,300,300i,400,400i,500,500i,700,700i,900,900i",
				"subsets": "cyrillic,cyrillic-ext,greek,greek-ext,latin,latin-ext,vietnamese"
			},
			"Roboto Condensed": {
				"category": "sans-serif",
				"variants": "300,300i,400,400i,700,700i",
				"subsets": "cyrillic,cyrillic-ext,greek,greek-ext,latin,latin-ext,vietnamese"
			},
			"Roboto Mono": {
				"category": "monospace",
				"variants": "100,200,300,400,500,600,700,100i,200i,300i,400i,500i,600i,700i",
				"subsets": "cyrillic,cyrillic-ext,greek,latin,latin-ext,vietnamese"
			},
			"Roboto Slab": {
				"category": "serif",
				"variants": "100,200,300,400,500,600,700,800,900",
				"subsets": "cyrillic,cyrillic-ext,greek,greek-ext,latin,latin-ext,vietnamese"
			},
			"Rochester": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Rock Salt": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Rokkitt": {
				"category": "serif",
				"variants": "100,200,300,400,500,600,700,800,900",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Romanesco": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Ropa Sans": {
				"category": "sans-serif",
				"variants": "400,400i",
				"subsets": "latin,latin-ext"
			},
			"Rosario": {
				"category": "sans-serif",
				"variants": "300,400,500,600,700,300i,400i,500i,600i,700i",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Rosarivo": {
				"category": "serif",
				"variants": "400,400i",
				"subsets": "latin,latin-ext"
			},
			"Rouge Script": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Rowdies": {
				"category": "display",
				"variants": "300,400,700",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Rozha One": {
				"category": "serif",
				"variants": "400",
				"subsets": "devanagari,latin,latin-ext"
			},
			"Rubik": {
				"category": "sans-serif",
				"variants": "300,400,500,600,700,800,900,300i,400i,500i,600i,700i,800i,900i",
				"subsets": "cyrillic,cyrillic-ext,hebrew,latin,latin-ext"
			},
			"Rubik Mono One": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "cyrillic,latin,latin-ext"
			},
			"Ruda": {
				"category": "sans-serif",
				"variants": "400,500,600,700,800,900",
				"subsets": "cyrillic,latin,latin-ext,vietnamese"
			},
			"Rufina": {
				"category": "serif",
				"variants": "400,700",
				"subsets": "latin,latin-ext"
			},
			"Ruge Boogie": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Ruluko": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Rum Raisin": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Ruslan Display": {
				"category": "display",
				"variants": "400",
				"subsets": "cyrillic,latin,latin-ext"
			},
			"Russo One": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "cyrillic,latin,latin-ext"
			},
			"Ruthie": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Rye": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Sacramento": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Sahitya": {
				"category": "serif",
				"variants": "400,700",
				"subsets": "devanagari,latin"
			},
			"Sail": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Saira": {
				"category": "sans-serif",
				"variants": "100,200,300,400,500,600,700,800,900",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Saira Condensed": {
				"category": "sans-serif",
				"variants": "100,200,300,400,500,600,700,800,900",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Saira Extra Condensed": {
				"category": "sans-serif",
				"variants": "100,200,300,400,500,600,700,800,900",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Saira Semi Condensed": {
				"category": "sans-serif",
				"variants": "100,200,300,400,500,600,700,800,900",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Saira Stencil One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Salsa": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Sanchez": {
				"category": "serif",
				"variants": "400,400i",
				"subsets": "latin,latin-ext"
			},
			"Sancreek": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Sansita": {
				"category": "sans-serif",
				"variants": "400,400i,700,700i,800,800i,900,900i",
				"subsets": "latin,latin-ext"
			},
			"Sansita Swashed": {
				"category": "display",
				"variants": "300,400,500,600,700,800,900",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Sarabun": {
				"category": "sans-serif",
				"variants": "100,100i,200,200i,300,300i,400,400i,500,500i,600,600i,700,700i,800,800i",
				"subsets": "latin,latin-ext,thai,vietnamese"
			},
			"Sarala": {
				"category": "sans-serif",
				"variants": "400,700",
				"subsets": "devanagari,latin,latin-ext"
			},
			"Sarina": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Sarpanch": {
				"category": "sans-serif",
				"variants": "400,500,600,700,800,900",
				"subsets": "devanagari,latin,latin-ext"
			},
			"Satisfy": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Sawarabi Gothic": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "cyrillic,japanese,latin,latin-ext,vietnamese"
			},
			"Sawarabi Mincho": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "japanese,latin,latin-ext"
			},
			"Scada": {
				"category": "sans-serif",
				"variants": "400,400i,700,700i",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext"
			},
			"Scheherazade": {
				"category": "serif",
				"variants": "400,700",
				"subsets": "arabic,latin"
			},
			"Schoolbell": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Scope One": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Seaweed Script": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Secular One": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "hebrew,latin,latin-ext"
			},
			"Sedgwick Ave": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Sedgwick Ave Display": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Sen": {
				"category": "sans-serif",
				"variants": "400,700,800",
				"subsets": "latin,latin-ext"
			},
			"Sevillana": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Seymour One": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "cyrillic,latin,latin-ext"
			},
			"Shadows Into Light": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Shadows Into Light Two": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Shanti": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Share": {
				"category": "display",
				"variants": "400,400i,700,700i",
				"subsets": "latin,latin-ext"
			},
			"Share Tech": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Share Tech Mono": {
				"category": "monospace",
				"variants": "400",
				"subsets": "latin"
			},
			"Shojumaru": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Short Stack": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Shrikhand": {
				"category": "display",
				"variants": "400",
				"subsets": "gujarati,latin,latin-ext"
			},
			"Siemreap": {
				"category": "display",
				"variants": "400",
				"subsets": "khmer"
			},
			"Sigmar One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Signika": {
				"category": "sans-serif",
				"variants": "300,400,500,600,700",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Signika Negative": {
				"category": "sans-serif",
				"variants": "300,400,600,700",
				"subsets": "latin,latin-ext"
			},
			"Simonetta": {
				"category": "display",
				"variants": "400,400i,900,900i",
				"subsets": "latin,latin-ext"
			},
			"Single Day": {
				"category": "display",
				"variants": "400",
				"subsets": "korean"
			},
			"Sintony": {
				"category": "sans-serif",
				"variants": "400,700",
				"subsets": "latin,latin-ext"
			},
			"Sirin Stencil": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Six Caps": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Skranji": {
				"category": "display",
				"variants": "400,700",
				"subsets": "latin,latin-ext"
			},
			"Slabo 13px": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Slabo 27px": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Slackey": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Smokum": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Smythe": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Sniglet": {
				"category": "display",
				"variants": "400,800",
				"subsets": "latin,latin-ext"
			},
			"Snippet": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Snowburst One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Sofadi One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Sofia": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Solway": {
				"category": "serif",
				"variants": "300,400,500,700,800",
				"subsets": "latin"
			},
			"Song Myung": {
				"category": "serif",
				"variants": "400",
				"subsets": "korean,latin"
			},
			"Sonsie One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Sora": {
				"category": "sans-serif",
				"variants": "100,200,300,400,500,600,700,800",
				"subsets": "latin,latin-ext"
			},
			"Sorts Mill Goudy": {
				"category": "serif",
				"variants": "400,400i",
				"subsets": "latin,latin-ext"
			},
			"Source Code Pro": {
				"category": "monospace",
				"variants": "200,200i,300,300i,400,400i,500,500i,600,600i,700,700i,900,900i",
				"subsets": "cyrillic,cyrillic-ext,greek,latin,latin-ext,vietnamese"
			},
			"Source Sans Pro": {
				"category": "sans-serif",
				"variants": "200,200i,300,300i,400,400i,600,600i,700,700i,900,900i",
				"subsets": "cyrillic,cyrillic-ext,greek,greek-ext,latin,latin-ext,vietnamese"
			},
			"Source Serif Pro": {
				"category": "serif",
				"variants": "200,200i,300,300i,400,400i,600,600i,700,700i,900,900i",
				"subsets": "cyrillic,cyrillic-ext,greek,latin,latin-ext,vietnamese"
			},
			"Space Grotesk": {
				"category": "sans-serif",
				"variants": "300,400,500,600,700",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Space Mono": {
				"category": "monospace",
				"variants": "400,400i,700,700i",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Spartan": {
				"category": "sans-serif",
				"variants": "100,200,300,400,500,600,700,800,900",
				"subsets": "latin,latin-ext"
			},
			"Special Elite": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Spectral": {
				"category": "serif",
				"variants": "200,200i,300,300i,400,400i,500,500i,600,600i,700,700i,800,800i",
				"subsets": "cyrillic,latin,latin-ext,vietnamese"
			},
			"Spectral SC": {
				"category": "serif",
				"variants": "200,200i,300,300i,400,400i,500,500i,600,600i,700,700i,800,800i",
				"subsets": "cyrillic,latin,latin-ext,vietnamese"
			},
			"Spicy Rice": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Spinnaker": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Spirax": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Squada One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Sree Krushnadevaraya": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin,telugu"
			},
			"Sriracha": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext,thai,vietnamese"
			},
			"Srisakdi": {
				"category": "display",
				"variants": "400,700",
				"subsets": "latin,latin-ext,thai,vietnamese"
			},
			"Staatliches": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Stalemate": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Stalinist One": {
				"category": "display",
				"variants": "400",
				"subsets": "cyrillic,latin,latin-ext"
			},
			"Stardos Stencil": {
				"category": "display",
				"variants": "400,700",
				"subsets": "latin"
			},
			"Stint Ultra Condensed": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Stint Ultra Expanded": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Stoke": {
				"category": "serif",
				"variants": "300,400",
				"subsets": "latin,latin-ext"
			},
			"Strait": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Stylish": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "korean,latin"
			},
			"Sue Ellen Francisco": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Suez One": {
				"category": "serif",
				"variants": "400",
				"subsets": "hebrew,latin,latin-ext"
			},
			"Sulphur Point": {
				"category": "sans-serif",
				"variants": "300,400,700",
				"subsets": "latin,latin-ext"
			},
			"Sumana": {
				"category": "serif",
				"variants": "400,700",
				"subsets": "devanagari,latin,latin-ext"
			},
			"Sunflower": {
				"category": "sans-serif",
				"variants": "300,500,700",
				"subsets": "korean,latin"
			},
			"Sunshiney": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Supermercado One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Sura": {
				"category": "serif",
				"variants": "400,700",
				"subsets": "devanagari,latin,latin-ext"
			},
			"Suranna": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin,telugu"
			},
			"Suravaram": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin,telugu"
			},
			"Suwannaphum": {
				"category": "display",
				"variants": "400",
				"subsets": "khmer"
			},
			"Swanky and Moo Moo": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Syncopate": {
				"category": "sans-serif",
				"variants": "400,700",
				"subsets": "latin"
			},
			"Syne": {
				"category": "sans-serif",
				"variants": "400,500,600,700,800",
				"subsets": "latin,latin-ext"
			},
			"Syne Mono": {
				"category": "monospace",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Syne Tactile": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Tajawal": {
				"category": "sans-serif",
				"variants": "200,300,400,500,700,800,900",
				"subsets": "arabic,latin"
			},
			"Tangerine": {
				"category": "handwriting",
				"variants": "400,700",
				"subsets": "latin"
			},
			"Taprom": {
				"category": "display",
				"variants": "400",
				"subsets": "khmer"
			},
			"Tauri": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Taviraj": {
				"category": "serif",
				"variants": "100,100i,200,200i,300,300i,400,400i,500,500i,600,600i,700,700i,800,800i,900,900i",
				"subsets": "latin,latin-ext,thai,vietnamese"
			},
			"Teko": {
				"category": "sans-serif",
				"variants": "300,400,500,600,700",
				"subsets": "devanagari,latin,latin-ext"
			},
			"Telex": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Tenali Ramakrishna": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,telugu"
			},
			"Tenor Sans": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "cyrillic,latin,latin-ext"
			},
			"Text Me One": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Texturina": {
				"category": "serif",
				"variants": "100,200,300,400,500,600,700,800,900,100i,200i,300i,400i,500i,600i,700i,800i,900i",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Thasadith": {
				"category": "sans-serif",
				"variants": "400,400i,700,700i",
				"subsets": "latin,latin-ext,thai,vietnamese"
			},
			"The Girl Next Door": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Tienne": {
				"category": "serif",
				"variants": "400,700,900",
				"subsets": "latin"
			},
			"Tillana": {
				"category": "handwriting",
				"variants": "400,500,600,700,800",
				"subsets": "devanagari,latin,latin-ext"
			},
			"Timmana": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,telugu"
			},
			"Tinos": {
				"category": "serif",
				"variants": "400,400i,700,700i",
				"subsets": "cyrillic,cyrillic-ext,greek,greek-ext,hebrew,latin,latin-ext,vietnamese"
			},
			"Titan One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Titillium Web": {
				"category": "sans-serif",
				"variants": "200,200i,300,300i,400,400i,600,600i,700,700i,900",
				"subsets": "latin,latin-ext"
			},
			"Tomorrow": {
				"category": "sans-serif",
				"variants": "100,100i,200,200i,300,300i,400,400i,500,500i,600,600i,700,700i,800,800i,900,900i",
				"subsets": "latin,latin-ext"
			},
			"Trade Winds": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Trirong": {
				"category": "serif",
				"variants": "100,100i,200,200i,300,300i,400,400i,500,500i,600,600i,700,700i,800,800i,900,900i",
				"subsets": "latin,latin-ext,thai,vietnamese"
			},
			"Trispace": {
				"category": "sans-serif",
				"variants": "100,200,300,400,500,600,700,800",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Trocchi": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Trochut": {
				"category": "display",
				"variants": "400,400i,700",
				"subsets": "latin"
			},
			"Trykker": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Tulpen One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Turret Road": {
				"category": "display",
				"variants": "200,300,400,500,700,800",
				"subsets": "latin,latin-ext"
			},
			"Ubuntu": {
				"category": "sans-serif",
				"variants": "300,300i,400,400i,500,500i,700,700i",
				"subsets": "cyrillic,cyrillic-ext,greek,greek-ext,latin,latin-ext"
			},
			"Ubuntu Condensed": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "cyrillic,cyrillic-ext,greek,greek-ext,latin,latin-ext"
			},
			"Ubuntu Mono": {
				"category": "monospace",
				"variants": "400,400i,700,700i",
				"subsets": "cyrillic,cyrillic-ext,greek,greek-ext,latin,latin-ext"
			},
			"Ultra": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Uncial Antiqua": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Underdog": {
				"category": "display",
				"variants": "400",
				"subsets": "cyrillic,latin,latin-ext"
			},
			"Unica One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"UnifrakturCook": {
				"category": "display",
				"variants": "700",
				"subsets": "latin"
			},
			"UnifrakturMaguntia": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Unkempt": {
				"category": "display",
				"variants": "400,700",
				"subsets": "latin"
			},
			"Unlock": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Unna": {
				"category": "serif",
				"variants": "400,400i,700,700i",
				"subsets": "latin,latin-ext"
			},
			"VT323": {
				"category": "monospace",
				"variants": "400",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Vampiro One": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Varela": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Varela Round": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "hebrew,latin,latin-ext,vietnamese"
			},
			"Varta": {
				"category": "sans-serif",
				"variants": "300,400,500,600,700",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Vast Shadow": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Vesper Libre": {
				"category": "serif",
				"variants": "400,500,700,900",
				"subsets": "devanagari,latin,latin-ext"
			},
			"Viaoda Libre": {
				"category": "display",
				"variants": "400",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext,vietnamese"
			},
			"Vibes": {
				"category": "display",
				"variants": "400",
				"subsets": "arabic,latin"
			},
			"Vibur": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Vidaloka": {
				"category": "serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Viga": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Voces": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Volkhov": {
				"category": "serif",
				"variants": "400,400i,700,700i",
				"subsets": "latin"
			},
			"Vollkorn": {
				"category": "serif",
				"variants": "400,500,600,700,800,900,400i,500i,600i,700i,800i,900i",
				"subsets": "cyrillic,cyrillic-ext,greek,latin,latin-ext,vietnamese"
			},
			"Vollkorn SC": {
				"category": "serif",
				"variants": "400,600,700,900",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext,vietnamese"
			},
			"Voltaire": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Waiting for the Sunrise": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Wallpoet": {
				"category": "display",
				"variants": "400",
				"subsets": "latin"
			},
			"Walter Turncoat": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Warnes": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Wellfleet": {
				"category": "display",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Wendy One": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin,latin-ext"
			},
			"Wire One": {
				"category": "sans-serif",
				"variants": "400",
				"subsets": "latin"
			},
			"Work Sans": {
				"category": "sans-serif",
				"variants": "100,200,300,400,500,600,700,800,900,100i,200i,300i,400i,500i,600i,700i,800i,900i",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Xanh Mono": {
				"category": "monospace",
				"variants": "400,400i",
				"subsets": "latin,latin-ext,vietnamese"
			},
			"Yanone Kaffeesatz": {
				"category": "sans-serif",
				"variants": "200,300,400,500,600,700",
				"subsets": "cyrillic,latin,latin-ext,vietnamese"
			},
			"Yantramanav": {
				"category": "sans-serif",
				"variants": "100,300,400,500,700,900",
				"subsets": "devanagari,latin,latin-ext"
			},
			"Yatra One": {
				"category": "display",
				"variants": "400",
				"subsets": "devanagari,latin,latin-ext"
			},
			"Yellowtail": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Yeon Sung": {
				"category": "display",
				"variants": "400",
				"subsets": "korean,latin"
			},
			"Yeseva One": {
				"category": "display",
				"variants": "400",
				"subsets": "cyrillic,cyrillic-ext,latin,latin-ext,vietnamese"
			},
			"Yesteryear": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Yrsa": {
				"category": "serif",
				"variants": "300,400,500,600,700",
				"subsets": "latin,latin-ext"
			},
			"ZCOOL KuaiLe": {
				"category": "display",
				"variants": "400",
				"subsets": "chinese-simplified,latin"
			},
			"ZCOOL QingKe HuangYou": {
				"category": "display",
				"variants": "400",
				"subsets": "chinese-simplified,latin"
			},
			"ZCOOL XiaoWei": {
				"category": "serif",
				"variants": "400",
				"subsets": "chinese-simplified,latin"
			},
			"Zeyada": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "latin"
			},
			"Zhi Mang Xing": {
				"category": "handwriting",
				"variants": "400",
				"subsets": "chinese-simplified,latin"
			},
			"Zilla Slab": {
				"category": "serif",
				"variants": "300,300i,400,400i,500,500i,600,600i,700,700i",
				"subsets": "latin,latin-ext"
			},
			"Zilla Slab Highlight": {
				"category": "display",
				"variants": "400,700",
				"subsets": "latin,latin-ext"
			}
		};

		var dictionaries = {
			'en': {
				'selectFont': 'Select a font',
				'search': 'Search',
				'allLangs': 'All languages',
				'favFonts': 'Favorite fonts',
				'localFonts': 'Local fonts',
				'googleFonts': 'Google fonts',
				'select': 'Select',
				'styles': 'styles',
				'sampleText': 'The quick brown fox jumps over the lazy dog.',
				'sampleTextEditable': 'Sample text, editable'
			},
			'nl': {
				'selectFont': 'Kies een lettertype',
				'search': 'Zoek',
				'allLangs': 'Alle talen',
				'favFonts': 'Favoriete lettertypen',
				'localFonts': 'Lokale lettertypen',
				'googleFonts': 'Google lettertypen',
				'select': 'Kies',
				'styles': 'stijlen',
				'sampleText': 'Wazig tv-filmpje rond chique skybox.',
				'sampleTextEditable': 'Voorbeeldtekst, bewerkbaar'
			},
			'de': {
				'selectFont': 'Schriftart wählen',
				'search': 'Suchen',
				'allLangs': 'Alle Sprachen',
				'favFonts': 'Favorisierte Schriftarten',
				'localFonts': 'Lokale Schriftarten',
				'googleFonts': 'Google Schriftarten',
				'select': 'Wählen',
				'styles': 'stile',
				'sampleText': 'Vogel Quax zwickt Johnys Pferd Bim.',
				'sampleTextEditable': 'Beispieltext, editierbar'
			},
			'es': {
				'selectFont': 'Seleccionar fuente',
				'search': 'Buscar',
				'allLangs': 'Todos los idiomas',
				'favFonts': 'Fuentes favoritas',
				'localFonts': 'Fuentes locales',
				'googleFonts': 'Fuentes de Google',
				'select': 'Seleccionar',
				'styles': 'estilos',
				'sampleText': 'La cigüeña tocaba cada vez mejor el saxofón y el búho pedía kiwi y queso',
				'sampleTextEditable': 'Texto de ejemplo, editable'
			},
			'fr': {
				'selectFont': 'Selectionner une police',
				'search': 'Rechercher',
				'allLangs': 'Toutes les langues',
				'favFonts': 'Polices favorites',
				'localFonts': 'Polices locales',
				'googleFonts': 'Polices Google',
				'select': 'Selectionner',
				'styles': 'Styles',
				'sampleText': 'Le vif renard brun saute par-dessus le chien paresseux.',
				'sampleTextEditable': 'Texte d\'exemple, éditable'
			}
		};

		var settings = {
			lang: 'en', // Interface language
			variants: true, // Whether or not to show font variants
			nrRecents: 3, // How many recently picked fonts to remember (shown in 'Favorite fonts' section)
			lazyLoad: true, // Whether or not to lazy load fonts
			debug: false, // Debugging shows some useful info in console
			localFontsUrl: '/fonts/', // Where .woff files (for local fonts) reside
			parentElement: 'body', // What element to attach the Fontpicker to

			localFonts: {// Default: web safe fonts available on all platforms
				"Arial": {
					"category": "sans-serif",
					"variants": "400,400i,600,600i"
				},
				"Courier New": {
					"category": "monospace",
					"variants": "400,400i,600,600i"
				},
				"Georgia": {
					"category": "serif",
					"variants": "400,400i,600,600i"
				},
				"Tahoma": {
					"category": "sans-serif",
					"variants": "400,400i,600,600i"
				},
				"Times New Roman": {
					"category": "serif",
					"variants": "400,400i,600,600i"
				},
				"Trebuchet MS": {
					"category": "sans-serif",
					"variants": "400,400i,600,600i"
				},
				"Verdana": {
					"category": "sans-serif",
					"variants": "400,400i,600,600i",
				}
			}
		}; // End settings

		var Fontpicker = (function() {

			function Fontpicker(original, options) {
				if (options.googleFonts && Array.isArray(options.googleFonts)) {
					// User supplied an array of Google fonts.
					var googleFonts = {}, fontFamily;
					for (var f = 0; f < options.googleFonts.length; f++) {
						fontFamily = options.googleFonts[f];
						googleFonts[fontFamily] = __googleFonts[fontFamily];
					}
					options.googleFonts = googleFonts;
				}
				else if (false !== options.googleFonts) {
					// If user did not supply a subset of Google Fonts, list them all
					options.googleFonts = __googleFonts;
				}

				if (!options.localFonts) {
					options.localFonts = [];
				}

				if (!dictionaries[options.lang]) {
					options.lang = 'en';
				}

				this.dictionary = dictionaries[options.lang];

				this.allFonts = {'google':options.googleFonts, 'local':options.localFonts};
				this.options = options;
				this.$original = $(original);
				this.setupHtml();
				this.bindEvents();
			}

			Fontpicker.prototype = {

				/**
				 * Load font, either from Google or from local url.
				 *
				 * @param {string} type Font type, either 'google' or 'local'.
				 * @param {string} font Font family name. F.e: 'Chakra', 'Zilla Slab'.
				 */
				loadFont: function(type, font) {
					if (fontsLoaded[font]) { return; }
					fontsLoaded[font] = true;

					switch(type) {
						case 'google':
							var url = 'https://fonts.googleapis.com/css?family=' + font.replace(/ /g,'+') + ':' + this.options.googleFonts[font].variants + '&display=swap';
							this.options.debug && console.log('Loading Google font ' + font + ' from ' + url);
							$('head').append($('<link>', {href:url, rel:'stylesheet', type:'text/css'}));
							break;

						case 'local':
							this.options.debug && console.log('Loading local font ' + font);
							$('head').append("<style> @font-face { font-family:'" + font + "'; src:local('" + font + "'), url('" + this.options.localFontsUrl + font + ".woff') format('woff'); } </style>");
							break;
					}
				},

				/**
				 * Show an (editable) font sample.
				 *
				 * @param {object} $li jQuery list object to extract font spec from (stored in data attributes).
				 */
				showSample: function($li) {
					$('.fp-sample', this.$element).css({
						fontFamily: "'" + $li.data('font-family') + "'",
						fontStyle: $li.data('font-italic') ? 'italic' : 'normal',
						fontWeight: $li.data('font-weight') || 400
					});
				},

				/**
				 * Handle key presses.
				 *
				 * @param {object} e Event.
				 * @param {object} el Element that received the event.
				 */
				keyDown: function(e, el) {
					function stop(e) {
						e.preventDefault();
						e.stopPropagation();
					}

					var $activeLi = $('li.fp-active:visible', this.$results);

					if ((e.keyCode >= 49 && e.keyCode <= 57) || (e.keyCode >= 97 && e.keyCode <= 105)) {
						// Numbers 1-9
						stop(e);
						var fw = 100 * (e.keyCode - (e.keyCode >= 97 ? 96 : 48));
						$('.fp-pill[data-font-weight='+fw+']', $activeLi).trigger('click');
						return;
					}
                    var $nextLi = undefined
					switch(e.keyCode) {
						case 73: // i, italic
							stop(e);
							$('.fp-pill.italic:visible', $activeLi).trigger('click');
							break;

						case 38: // Cursor up
							stop(e);
							$prevLi = $activeLi.prevAll(':not(.fp-divider):visible:first');
							if ($prevLi.length == 0) {
								$prevLi = $('li:not(.fp-divider):visible:last', this.$results);
							}
							$prevLi.trigger('mouseenter').trigger('click');

							__scrollIntoViewIfNeeded($prevLi[0]);
							break;

						case 40: // Cursor down
							stop(e);
							$nextLi = $activeLi.nextAll(':not(.fp-divider):visible:first');
							if ($nextLi.length == 0) {
								$nextLi = $('li:not(.fp-divider):visible:first', this.$results);
							}
							$nextLi.trigger('mouseenter').trigger('click');

							__scrollIntoViewIfNeeded($nextLi[0]);
							break;

						case 13: // Enter
							stop(e);
							$('li.fp-active', this.$results).find('button.apply').trigger('click');
							break;

						case 27: // Esc
							stop(e);
							$('.fp-close', this.$modal).trigger('click');
							break;
					}
				},

				/**
				 * Handle mouse enter events on items in the font list.
				 *
				 * @param {object} e Event.
				 * @param {object} el Element that received the event.
				 */
				mouseEnter: function(e, el) {
					var $li = $(el);
					$('li.fp-hover', this.$results).removeClass('fp-hover');
					$li.addClass('fp-hover');

					this.loadFont($li.data('font-type'), $li.data('font-family'));
					this.showSample($li);
				},

				/**
				 * Handle clicks on items in the font list.
				 * @param {object} e Event.
				 * @param {object} el Element that received the event.
				 */
				click: function(e, el) {
					var $li = $(el), self = this,
						fontType = $li.data('font-type'),
						fontFamily = $li.data('font-family'),
						italic = $li.data('font-italic') || false,
						weight = $li.data('font-weight') || 400,
						$lis = $("li[data-font-family='" + fontFamily + "']", this.$results),
						favorites = __cookie('favs'),
						favoriteFonts = favorites ? favorites.split(',') : [];

					$('li.fp-active', this.$results).removeClass('fp-active').find('.fp-variants,.fp-btns').remove();

					$li.addClass('fp-active');

					var $btns = $('<div class="fp-btns">'),
						isFav = favoriteFonts.indexOf(fontType + ':' + fontFamily) != -1;

					$btns.append(
						$('<span class="fp-favorite' + (isFav ? ' checked' : '') + '"></span>')
						.on('click', function(e) {
							e.stopPropagation();

							var idx = favoriteFonts.indexOf(fontType + ':' + fontFamily);
							if ($(this).is('.checked')) {
								// Remove from favorites
								if (idx != -1) {
									favoriteFonts.splice(idx, 1);
								}
							}
							else {
								// Add to favorites
								if (-1 == idx) {
									favoriteFonts.push(fontType + ':' + fontFamily);
								}
							}
							$(this).toggleClass('checked');
							__cookie('favs', favoriteFonts.join(','));
						}),

						$('<button type="button" class="fp-btn apply">')
						.html(this.dictionary['select'])
						.on('click', function(e) {
							e.stopPropagation();

							italic = $li.data('font-italic');
							weight = $li.data('font-weight') || 400;

							var value = fontFamily;
							if (self.options.variants) {
								value += ':' + weight + (italic ? 'i':'');
							}

							self.$select.css({
								fontFamily: "'" + fontFamily  + "'",
								fontStyle: italic ? 'italic' : 'normal',
								fontWeight: weight
							}).find('.fp-fontspec').html(value);

							self.$original.val(value).change(); // Update original <input> element

							// Call onSelect callback, if specified
							if (!!self.options.onSelect) {
								self.options.onSelect({
									fontType: fontType,
									fontFamily: fontFamily,
									fontStyle: italic ? 'italic' : 'normal',
									fontWeight: weight,
									fontSpec: value
								});
							}

							self.toggleModal('hide');

							// Save recent
							if (!!self.options.nrRecents) {
								var recentFonts = __cookie('recents'),
									cookieVal = $li.data('font-type') + ':' + fontFamily;

								recentFonts = recentFonts ? recentFonts.split(',') : [];
								if (recentFonts.indexOf(cookieVal) == -1) {
									recentFonts.unshift(cookieVal);
								}

								recentFonts = recentFonts.slice(0,self.options.nrRecents); // Remember last X
								__cookie('recents', recentFonts.join(','));
							}
						})
					)
					$btns.appendTo($li);

					var font = this.allFonts[fontType][fontFamily],
						variants = font.variants ? font.variants.split(',') : [];

					if (this.options.variants && variants.length > 1) {
						var $variants = $('<div class="fp-variants">'),
							hasItalic = false;

						for (var v = 0; v < variants.length; v++) {
							if (/i$/.test(variants[v])) {
								if (!hasItalic) { hasItalic = true; }
								continue;
							}

							let variant = variants[v],
								fontWeight = +variant.replace(/i$/,'');

							v > 0 && $variants.append(' '); // Separate by space

							$('<span data-font-weight="' + fontWeight + '" class="fp-pill weight' + (weight == fontWeight ? ' checked' : '') + '">')
							.text(variant)
							.on('click', function(e) {
								e.stopPropagation();

								if (variants.indexOf(fontWeight+'i') == -1) {
									// This font weight does not have an italic variant
									$('.fp-pill.italic', $li).removeClass('checked').css('display', 'none');
									italic = false;
									$li.data('font-italic', italic);
								}
								else {
									// This font weight does have an italic variant
									$('.fp-pill.italic', $li).css('display', '');
								}

								$('span.fp-pill.weight', $li).removeClass('checked');
								$(this).addClass('checked');

								$lis.data('font-weight', fontWeight); // Set for favorite and normal

								self.showSample($li);
							})
							.appendTo($variants);
						}

						if (hasItalic) {
							$variants.append(' ');
							$('<span class="fp-pill italic ' + (italic ? ' checked' : '') + '">')
							.css('display', variants.indexOf(weight+'i') == -1 ? 'none' : '')
							.html('italic')
							.on('click', function(e) {
								e.stopPropagation();
								italic = !italic;
								$(this).toggleClass('checked');

								$lis.data('font-italic', italic); // Set for favorite and normal

								self.showSample($li);
							}).appendTo($variants);
						}

						$li.append($variants);
					}

					else if (variants.length == 1 && /i$/.test(variants[0])) {
						$lis.data('font-italic', true);
					}
				},

				/**
				 * Turn a font spec (Arial:700i, Canga:400) into its components: family, weight and italic.
				 *
				 * @param {string} fontSpec The font specification to split into components.
				 * @return {object} An object containing 3 items: family (string), weight (int) and italic (bool).
				 */
				fontSpecToComponents: function(fontSpec) {
					var tmp = fontSpec.split(':'),
						family = tmp[0],
						variant = tmp[1] || '400',
						italic = false, weight = 400;

					if (/(\d+)i$/.test(variant)) {
						italic = true;
						weight = +RegExp.$1;
					}
					else {
						weight = +variant;
					}

					return {
						family: family,
						weight: weight,
						italic: italic
					}
				},

				/**
				 * Style the original input element with a font.
				 *
				 * @param {string} fontSpec The font specification, f.e: 'Changa:400i' or 'Arial'.
				 */
				applyFontToOriginalInput: function(fontSpec) {
					if ('' === fontSpec) {
						this.$select
						.removeAttr('style')
						.find('.fp-fontspec')
						.html(this.dictionary['selectFont']);

						this.$original.val('');
						return;
					}

					var font = this.fontSpecToComponents(fontSpec);
					this.loadFont(this.options.googleFonts !== false && __googleFonts[font.family] ? 'google' : 'local', font.family);

					this.$select.css({
						fontFamily: "'" + font.family + "'",
						fontStyle: font.italic ? 'italic' : 'normal',
						fontWeight: font.weight
					})
					.find('.fp-fontspec').html(fontSpec);
				},

				/**
				 * Bind all events.
				 */
				bindEvents: function() {
					var self = this;

					this.$results
					.on('keydown', function(e) {
						self.keyDown(e, this);
					})
					.on('mouseenter', 'li:not(.fp-divider):visible', function(e) {
						self.mouseEnter(e, this);
					})
					.on('click', 'li:not(.fp-divider):visible', function(e) {
						self.click(e, this);
					})
					.on('dblclick', 'li:not(.fp-divider):visible', function(e) {
						$('li.fp-active', this.$results).find('button.apply').trigger('click');
					});

					this.$original.on('change', function(e) {
						self.applyFontToOriginalInput(this.value);
					});
				},

				/**
				 * Automatically load fonts as they come in to view.
				 */
				lazyLoad: function() {
					if (!window.IntersectionObserver) { return; }

					var self = this, $li;

					var observer = new IntersectionObserver(function(lis) {
						[].forEach.call(lis, function(li) {
							if (li.intersectionRatio > 0) {
								observer.unobserve(li.target); // Load only once per li
								$li = $(li.target);
								self.loadFont($li.data('font-type'), $li.data('font-family'));
								$li.css('fontFamily', "'" + $li.data('font-family') + "'");
							}
						});
					});

					$('li:not(.fp-divider)', this.$results).each(function() {
						observer.observe(this);
					});
				},

				/**
				 * Show or hide the fontpicker modal window.
				 *
				 * @param {string} state Either 'hide' or 'show'. When omitted visibility of the modal is toggled.
				 */
				toggleModal: function(state) {
					if (!state) {
						state = this.$modal.is(':visible') ? 'hide' : 'show';
					}

					if ('hide' == state) {
						// Hide modal
						$('.fp-fav,.fp-variants,.fp-btns').remove();

						this.$modal.css('display','none');
						$('.fp-modal-backdrop', this.$element).remove();
						$(this.options.parentElement).removeClass('fp-modal-open');
						$('span', this.$select).focus();
					}
					else {
						// Show modal
						$(this.options.parentElement).addClass('fp-modal-open');

						this.$element.append(
							$('<div class="fp-modal-backdrop">')
							.on('click', function() {
								// Click outside modal window closes the modal
								$('.fp-close', this.$modal).trigger('click');
							})
						);

						this.$modal.css('display','flex');

						this.getFavorites(); // List favorites & recents

						var fontSpec = this.$original.val();
						if (fontSpec) {
							var font = this.fontSpecToComponents(fontSpec),
								$li = $("li[data-font-family='" + font.family + "']", this.$results); // Either 0, 1 or 2 elements

							if ($li.length > 0) {
								$li.data({
									'font-italic': font.italic,
									'font-weight': font.weight
								}).eq(0).trigger('click');

								__scrollIntoViewIfNeeded($li[0]);
							}
						}
						else {
							this.$results.scrollTop(0);
						}

						this.options.lazyLoad && this.lazyLoad();
						this.$results.focus(); // Make keyboard work
					}
				},

				/**
				 * Apply user filters to font list: language, categories and search term.
				 */
				applyFilter: function() {
					var lang = this.$lang.val(),
						searchTerm = this.$search.val().trim(),
						cats = [];

					$('.fp-category', this.$filter).each(function() {
						if ($(this).hasClass('checked')) {
							cats.push($(this).data('category'));
						}
					});

					// Remember lang and cats
					__cookie('lang', '' === lang ? false : lang);
					__cookie('cats', cats.join(','));

					for (var c in this.allFonts) {
						for (var f in this.allFonts[c]) {
							var item = this.allFonts[c][f],
								langs = item.subsets ? item.subsets.split(',') : [],
								$li = $("li[data-font-family='" + f + "']", this.$results),
								cat = item.category || 'other';

							if ( ('' == lang || langs.indexOf(lang) != -1) &&
								 (cats.indexOf(cat) != -1) &&
								 ('' == searchTerm || f.toLowerCase().indexOf(searchTerm.toLowerCase()) != -1) ) {
								$li.show();
							}
							else {
								$li.hide();
							}
						}
					}
				},

				/**
				 * Construct filter UI.
				 */
				getFilterUI: function() {
					var self = this,
						$searchWrap = $('<div class="fp-search-wrap">');

					this.$filter = $('<div class="fp-filter">');

					// Search input
					this.$search = $('<input>', {'class':'fp-search', type:'text', placeholder:this.dictionary['search'], spellcheck:false})
					.on('keyup', function() {
						self.applyFilter();
					})
					.appendTo($searchWrap);

					// Clear button
					$('<div class="fp-clear">')
					.on('click', function() {
						self.$search.val('').focus();
						self.applyFilter();
					})
					.appendTo($searchWrap);

					// Language pulldown
					var opts = ['<option value="">' + this.dictionary['allLangs'] + '</option>'];
					for (var l in googleFontLangs) {
						opts.push('<option value="' + l + '">' + googleFontLangs[l] + '</option>');
					}
					this.$lang = $('<select class="fp-lang">').on('change', function() {
						self.applyFilter();
					}).html(opts.join(''));

					this.$filter.append(
						$('<div class="fp-row">').append(
							$searchWrap,
							this.$lang
						)
					);

					$('<div class="hr">').appendTo(this.$filter);

					var gFontCats = googleFontCats.slice(0); // Clone
					gFontCats.push('other');
					for (var g = 0; g < gFontCats.length; g++) {
						$('<span class="fp-category fp-pill checked">')
						.data('category', gFontCats[g])
						.text(gFontCats[g])
						.on('click', function() {
							$(this).toggleClass('checked');
							self.applyFilter();
						})
						.appendTo(this.$filter);
					}
				},

				/**
				 * Construct font list.
				 */
				getFontsList: function() {
					var self = this,
						$frag = $(document.createDocumentFragment()), // Use a document fragment to increase performance
						$li,
						fontFamily;

					function append(fontType, fontFamily) {
						var font = self.allFonts[fontType][fontFamily], small = '';

						if (font.category || font.variants) {
							var items = [];
							if (font.category) { items.push(font.category); }
							if (self.options.variants && font.variants) {
								var nr = font.variants.split(',').length;
								if (nr > 1) {
									items.push(nr + ' ' + self.dictionary['styles']);
								}
							}
							small = ' <small>' + items.join(', ') + '</small>';
						}

						$li = $('<li>', {'data-font-type':fontType, 'data-font-family':fontFamily})
						.html(fontFamily + small);

						$frag.append($li[0]);
					}

					// Local fonts
					if (objLength(this.options.localFonts) > 0) {
						$li = $('<li class="fp-divider">' + this.dictionary['localFonts'] + '</li>');
						$frag.append($li[0]);
						for (fontFamily in this.options.localFonts) {
							append('local', fontFamily);
						}
					}

					// Google fonts
					if (objLength(this.options.googleFonts) > 0) {
						$li = $('<li class="fp-divider">' + this.dictionary['googleFonts'] + '</li>');
						$frag.append($li[0]);
						for (fontFamily in this.options.googleFonts) {
							append('google', fontFamily);
						}
					}

					this.$results = $('<ul>', {'class':'fp-results', tabindex:0}).append($frag);
				},

				/**
				 * Construct list of favorited and recently picked fonts
				 */
				getFavorites: function() {
					var favoriteFonts = __cookie('favs'),
						recentFonts = __cookie('recents');

					favoriteFonts = favoriteFonts ? favoriteFonts.split(',') : [];
					recentFonts = (!!this.options.nrRecents && recentFonts) ? recentFonts.split(',') : [];

					// Dedupe:
					var fonts = recentFonts.slice(0);
					for (var f = 0; f < favoriteFonts.length; f++) {
						if (fonts.indexOf(favoriteFonts[f]) == -1) {
							fonts.push(favoriteFonts[f]);
						}
					}

					var $frag = $(document.createDocumentFragment()), $li = null, $orgLi, tmp;
                    var fontType = "";
                    var fontFamily = "";
                    var font = undefined;
					for (var f = 0; f < fonts.length; f++) {
						tmp = fonts[f].split(':'), fontType = tmp[0], fontFamily = tmp[1], font = this.allFonts[fontType][fontFamily];
						if (!font) { continue; }

						$orgLi = $("[data-font-family='" + fontFamily + "']", this.$results);
						if ($orgLi.length > 0) {
							$li = $orgLi.clone().addClass('fp-fav');
							$frag.append($li[0]);
						}
					}

					if (null !== $li) {
						$frag.prepend($('<li class="fp-fav fp-divider">' + this.dictionary['favFonts'] + '</li>')[0]);
						this.$results.prepend($frag);
					}
				},

				/**
				 * Setup HTML structure for the font picker.
				 */
				setupHtml: function() {
					var self = this,
						fontSpec = this.$original.val();

					this.$original.hide();

					this.$select =
						$('<div class="font-picker fp-select">')
						.on('click', function() {
							self.toggleModal('show');
						})
						.on('keydown', function(e) {
							// Open the modal with spacebar
							if (e.keyCode == 32) {
								e.stopPropagation();
								e.preventDefault();
								self.toggleModal('show');
							}
						})
						.append('<span class="fp-fontspec" tabindex="0">' + (fontSpec ? fontSpec : this.dictionary['selectFont']) + '</span>');


					if (!!self.options.showClear) {
						// Add a clear button
						self.$select
						.append($('<span class="fp-clear"></span>')
						.on('click', function(e) {
							e.stopPropagation();

							self.$select
							.removeAttr('style')
							.find('.fp-fontspec')
							.html(self.dictionary['selectFont']);;

							self.$original.val('').change(); // Update original <input> element
						}));
					}

					this.$original.after(this.$select);

					this.$element = $('<div>', {'class': 'font-picker'});

					this.$modal = $('<div class="fp-modal">').appendTo(this.$element);

					this.$modal.append(
						$('<div class="fp-header">').append(
							$('<div class="fp-icons">').append(
								$('<span class="fp-close">&times</span>').on('click', function() {
									self.toggleModal('hide');
								})
							),
							$('<h5>').text(this.dictionary['selectFont'])
						)
					);

					this.getFilterUI();
					this.$modal.append(this.$filter);

					this.$sample = $('<div>', {'class':'fp-sample', contenteditable:true, spellcheck:false, title:this.dictionary['sampleTextEditable']})
						.html(this.dictionary['sampleText'])
						.appendTo(this.$modal);

					this.getFontsList();
					this.$modal.append(this.$results);

					var lang = __cookie('lang'), cats = __cookie('cats');

					if (lang) {
						this.$lang.val(lang);
					}

					if (cats) {
						cats = cats.split(',');
						$('.fp-category', this.$filter).each(function() {
							if (-1 == cats.indexOf($(this).data('category'))) {
								$(this).removeClass('checked');
							}
							else {
								$(this).addClass('checked');
							}
						});
					}

					if (lang || cats) {
						self.applyFilter();
					}

					fontSpec && self.applyFontToOriginalInput(fontSpec);

					$(this.options.parentElement).append(this.$element);
				},

				//
				// Public Methods, via $element.fontpicker(method)
				//

				/**
				 * Show the fontpicker.
				 */
				show: function() {
					var el = $(this).data('plugin_' + pluginName);
					if (!el.$select) {
						throw new Error('jquery.'+pluginName+': Cannot show, as I\'ve been destroyed.');
					}
					el.toggleModal('show');
				},

				/**
				 * Hide the fontpicker.
				 */
				hide: function() {
					var el = $(this).data('plugin_' + pluginName);
					if (!el.$select) {
						throw new Error('jquery.'+pluginName+': Cannot hide, as I\'ve been destroyed.');
					}
					el.toggleModal('hide');
				},

				/**
				 * Destroy the fontpicker plugin, revert element back to original.
				 */
				destroy: function() {
					var el = $(this).data('plugin_' + pluginName);
					if (!el.$select) {
						throw new Error('jquery.'+pluginName+': Cannot destroy, as I\'ve been destroyed already.');
					}
					el.toggleModal('hide');
					el.$select.remove();
					el.$element.remove();
					el.$original.off('setFont');
					el.$original.show();
					el.$select = el.$element = el.$original = el.$modal = null;
					$(el).removeData('plugin_' + pluginName);
				}
			}; // End prototype

			return Fontpicker;
		})();

		if (typeof arguments[0] === 'string') {
			var methodName = arguments[0],
				args = Array.prototype.slice.call(arguments, 1),
				returnVal;

			this.each(function() {
				if ($.data(this, 'plugin_' + pluginName) && typeof $.data(this, 'plugin_' + pluginName)[methodName] === 'function') {
					returnVal = $.data(this, 'plugin_' + pluginName)[methodName].apply(this, args);
				}
				else {
					throw new Error('jquery.'+pluginName+': Method ' +  methodName + ' does not exist.');
				}
			});

			return returnVal !== undefined ? returnVal : this; // Preserve chainablility
		}

		return this.each(function() {
			if (!$.data(this, 'plugin_'+pluginName)) {
				// If options exist, merge them
				options && $.extend(settings, options);
				$.data(this, 'plugin_'+pluginName, new Fontpicker(this, settings));
			}
		});
	};
})(jQuery);
// Spectrum Colorpicker v1.8.1
// https://github.com/bgrins/spectrum
// Author: Brian Grinstead
// License: MIT

(function (factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) { // AMD
        define(['jquery'], factory);
    }
    else if (typeof exports == "object" && typeof module == "object") { // CommonJS
        module.exports = factory(require('jquery'));
    }
    else { // Browser
        factory(jQuery);
    }
})(function($, undefined) {
    "use strict";

    var defaultOpts = {

        // Callbacks
        beforeShow: noop,
        move: noop,
        change: noop,
        show: noop,
        hide: noop,

        // Options
        color: false,
        flat: false,
        showInput: false,
        allowEmpty: false,
        showButtons: true,
        clickoutFiresChange: true,
        showInitial: false,
        showPalette: false,
        showPaletteOnly: false,
        hideAfterPaletteSelect: false,
        togglePaletteOnly: false,
        showSelectionPalette: true,
        localStorageKey: false,
        appendTo: "body",
        maxSelectionSize: 7,
        cancelText: "cancel",
        chooseText: "choose",
        togglePaletteMoreText: "more",
        togglePaletteLessText: "less",
        clearText: "Clear Color Selection",
        noColorSelectedText: "No Color Selected",
        preferredFormat: false,
        className: "", // Deprecated - use containerClassName and replacerClassName instead.
        containerClassName: "",
        replacerClassName: "",
        showAlpha: false,
        theme: "sp-light",
        palette: [["#ffffff", "#000000", "#ff0000", "#ff8000", "#ffff00", "#008000", "#0000ff", "#4b0082", "#9400d3"]],
        selectionPalette: [],
        disabled: false,
        offset: null
    },
    spectrums = [],
    IE = !!/msie/i.exec( window.navigator.userAgent ),
    rgbaSupport = (function() {
        function contains( str, substr ) {
            return !!~('' + str).indexOf(substr);
        }

        var elem = document.createElement('div');
        var style = elem.style;
        style.cssText = 'background-color:rgba(0,0,0,.5)';
        return contains(style.backgroundColor, 'rgba') || contains(style.backgroundColor, 'hsla');
    })(),
    replaceInput = [
        "<div class='sp-replacer'>",
            "<div class='sp-preview'><div class='sp-preview-inner'></div></div>",
            "<div class='sp-dd'>&#9660;</div>",
        "</div>"
    ].join(''),
    markup = (function () {

        // IE does not support gradients with multiple stops, so we need to simulate
        //  that for the rainbow slider with 8 divs that each have a single gradient
        var gradientFix = "";
        if (IE) {
            for (var i = 1; i <= 6; i++) {
                gradientFix += "<div class='sp-" + i + "'></div>";
            }
        }

        return [
            "<div class='sp-container sp-hidden'>",
                "<div class='sp-palette-container'>",
                    "<div class='sp-palette sp-thumb sp-cf'></div>",
                    "<div class='sp-palette-button-container sp-cf'>",
                        "<button type='button' class='sp-palette-toggle'></button>",
                    "</div>",
                "</div>",
                "<div class='sp-picker-container'>",
                    "<div class='sp-top sp-cf'>",
                        "<div class='sp-fill'></div>",
                        "<div class='sp-top-inner'>",
                            "<div class='sp-color'>",
                                "<div class='sp-sat'>",
                                    "<div class='sp-val'>",
                                        "<div class='sp-dragger'></div>",
                                    "</div>",
                                "</div>",
                            "</div>",
                            "<div class='sp-clear sp-clear-display'>",
                            "</div>",
                            "<div class='sp-hue'>",
                                "<div class='sp-slider'></div>",
                                gradientFix,
                            "</div>",
                        "</div>",
                        "<div class='sp-alpha'><div class='sp-alpha-inner'><div class='sp-alpha-handle'></div></div></div>",
                    "</div>",
                    "<div class='sp-input-container sp-cf'>",
                        "<input class='sp-input' type='text' spellcheck='false'  />",
                    "</div>",
                    "<div class='sp-initial sp-thumb sp-cf'></div>",
                    "<div class='sp-button-container sp-cf'>",
                        "<a class='sp-cancel' href='#'></a>",
                        "<button type='button' class='sp-choose'></button>",
                    "</div>",
                "</div>",
            "</div>"
        ].join("");
    })();

    function paletteTemplate (p, color, className, opts) {
        var html = [];
        for (var i = 0; i < p.length; i++) {
            var current = p[i];
            if(current) {
                var tiny = tinycolor(current);
                var c = tiny.toHsl().l < 0.5 ? "sp-thumb-el sp-thumb-dark" : "sp-thumb-el sp-thumb-light";
                c += (tinycolor.equals(color, current)) ? " sp-thumb-active" : "";
                var formattedString = tiny.toString(opts.preferredFormat || "rgb");
                var swatchStyle = rgbaSupport ? ("background-color:" + tiny.toRgbString()) : "filter:" + tiny.toFilter();
                html.push('<span title="' + formattedString + '" data-color="' + tiny.toRgbString() + '" class="' + c + '"><span class="sp-thumb-inner" style="' + swatchStyle + ';"></span></span>');
            } else {
                var cls = 'sp-clear-display';
                html.push($('<div />')
                    .append($('<span data-color="" style="background-color:transparent;" class="' + cls + '"></span>')
                        .attr('title', opts.noColorSelectedText)
                    )
                    .html()
                );
            }
        }
        return "<div class='sp-cf " + className + "'>" + html.join('') + "</div>";
    }

    function hideAll() {
        for (var i = 0; i < spectrums.length; i++) {
            if (spectrums[i]) {
                spectrums[i].hide();
            }
        }
    }

    function instanceOptions(o, callbackContext) {
        var opts = $.extend({}, defaultOpts, o);
        opts.callbacks = {
            'move': bind(opts.move, callbackContext),
            'change': bind(opts.change, callbackContext),
            'show': bind(opts.show, callbackContext),
            'hide': bind(opts.hide, callbackContext),
            'beforeShow': bind(opts.beforeShow, callbackContext)
        };

        return opts;
    }

    function spectrum(element, o) {

        var opts = instanceOptions(o, element),
            flat = opts.flat,
            showSelectionPalette = opts.showSelectionPalette,
            localStorageKey = opts.localStorageKey,
            theme = opts.theme,
            callbacks = opts.callbacks,
            resize = throttle(reflow, 10),
            visible = false,
            isDragging = false,
            dragWidth = 0,
            dragHeight = 0,
            dragHelperHeight = 0,
            slideHeight = 0,
            slideWidth = 0,
            alphaWidth = 0,
            alphaSlideHelperWidth = 0,
            slideHelperHeight = 0,
            currentHue = 0,
            currentSaturation = 0,
            currentValue = 0,
            currentAlpha = 1,
            palette = [],
            paletteArray = [],
            paletteLookup = {},
            selectionPalette = opts.selectionPalette.slice(0),
            maxSelectionSize = opts.maxSelectionSize,
            draggingClass = "sp-dragging",
            shiftMovementDirection = null;

        var doc = element.ownerDocument,
            body = doc.body,
            boundElement = $(element),
            disabled = false,
            container = $(markup, doc).addClass(theme),
            pickerContainer = container.find(".sp-picker-container"),
            dragger = container.find(".sp-color"),
            dragHelper = container.find(".sp-dragger"),
            slider = container.find(".sp-hue"),
            slideHelper = container.find(".sp-slider"),
            alphaSliderInner = container.find(".sp-alpha-inner"),
            alphaSlider = container.find(".sp-alpha"),
            alphaSlideHelper = container.find(".sp-alpha-handle"),
            textInput = container.find(".sp-input"),
            paletteContainer = container.find(".sp-palette"),
            initialColorContainer = container.find(".sp-initial"),
            cancelButton = container.find(".sp-cancel"),
            clearButton = container.find(".sp-clear"),
            chooseButton = container.find(".sp-choose"),
            toggleButton = container.find(".sp-palette-toggle"),
            isInput = boundElement.is("input"),
            isInputTypeColor = isInput && boundElement.attr("type") === "color" && inputTypeColorSupport(),
            shouldReplace = isInput && !flat,
            replacer = (shouldReplace) ? $(replaceInput).addClass(theme).addClass(opts.className).addClass(opts.replacerClassName) : $([]),
            offsetElement = (shouldReplace) ? replacer : boundElement,
            previewElement = replacer.find(".sp-preview-inner"),
            initialColor = opts.color || (isInput && boundElement.val()),
            colorOnShow = false,
            currentPreferredFormat = opts.preferredFormat,
            clickoutFiresChange = !opts.showButtons || opts.clickoutFiresChange,
            isEmpty = !initialColor,
            allowEmpty = opts.allowEmpty && !isInputTypeColor;

        function applyOptions() {

            if (opts.showPaletteOnly) {
                opts.showPalette = true;
            }

            toggleButton.text(opts.showPaletteOnly ? opts.togglePaletteMoreText : opts.togglePaletteLessText);

            if (opts.palette) {
                palette = opts.palette.slice(0);
                paletteArray = $.isArray(palette[0]) ? palette : [palette];
                paletteLookup = {};
                for (var i = 0; i < paletteArray.length; i++) {
                    for (var j = 0; j < paletteArray[i].length; j++) {
                        var rgb = tinycolor(paletteArray[i][j]).toRgbString();
                        paletteLookup[rgb] = true;
                    }
                }
            }

            container.toggleClass("sp-flat", flat);
            container.toggleClass("sp-input-disabled", !opts.showInput);
            container.toggleClass("sp-alpha-enabled", opts.showAlpha);
            container.toggleClass("sp-clear-enabled", allowEmpty);
            container.toggleClass("sp-buttons-disabled", !opts.showButtons);
            container.toggleClass("sp-palette-buttons-disabled", !opts.togglePaletteOnly);
            container.toggleClass("sp-palette-disabled", !opts.showPalette);
            container.toggleClass("sp-palette-only", opts.showPaletteOnly);
            container.toggleClass("sp-initial-disabled", !opts.showInitial);
            container.addClass(opts.className).addClass(opts.containerClassName);

            reflow();
        }

        function initialize() {

            if (IE) {
                container.find("*:not(input)").attr("unselectable", "on");
            }

            applyOptions();

            if (shouldReplace) {
                boundElement.after(replacer).hide();
            }

            if (!allowEmpty) {
                clearButton.hide();
            }

            if (flat) {
                boundElement.after(container).hide();
            }
            else {

                var appendTo = opts.appendTo === "parent" ? boundElement.parent() : $(opts.appendTo);
                if (appendTo.length !== 1) {
                    appendTo = $("body");
                }

                appendTo.append(container);
            }

            updateSelectionPaletteFromStorage();

            offsetElement.on("click.spectrum touchstart.spectrum", function (e) {
                if (!disabled) {
                    toggle();
                }

                e.stopPropagation();

                if (!$(e.target).is("input")) {
                    e.preventDefault();
                }
            });

            if(boundElement.is(":disabled") || (opts.disabled === true)) {
                disable();
            }

            // Prevent clicks from bubbling up to document.  This would cause it to be hidden.
            container.click(stopPropagation);

            // Handle user typed input
            textInput.change(setFromTextInput);
            textInput.on("paste", function () {
                setTimeout(setFromTextInput, 1);
            });
            textInput.keydown(function (e) { if (e.keyCode == 13) { setFromTextInput(); } });

            cancelButton.text(opts.cancelText);
            cancelButton.on("click.spectrum", function (e) {
                e.stopPropagation();
                e.preventDefault();
                revert();
                hide();
            });

            clearButton.attr("title", opts.clearText);
            clearButton.on("click.spectrum", function (e) {
                e.stopPropagation();
                e.preventDefault();
                isEmpty = true;
                move();

                if(flat) {
                    //for the flat style, this is a change event
                    updateOriginalInput(true);
                }
            });

            chooseButton.text(opts.chooseText);
            chooseButton.on("click.spectrum", function (e) {
                e.stopPropagation();
                e.preventDefault();

                if (IE && textInput.is(":focus")) {
                    textInput.trigger('change');
                }

                if (isValid()) {
                    updateOriginalInput(true);
                    hide();
                }
            });

            toggleButton.text(opts.showPaletteOnly ? opts.togglePaletteMoreText : opts.togglePaletteLessText);
            toggleButton.on("click.spectrum", function (e) {
                e.stopPropagation();
                e.preventDefault();

                opts.showPaletteOnly = !opts.showPaletteOnly;

                // To make sure the Picker area is drawn on the right, next to the
                // Palette area (and not below the palette), first move the Palette
                // to the left to make space for the picker, plus 5px extra.
                // The 'applyOptions' function puts the whole container back into place
                // and takes care of the button-text and the sp-palette-only CSS class.
                if (!opts.showPaletteOnly && !flat) {
                    container.css('left', '-=' + (pickerContainer.outerWidth(true) + 5));
                }
                applyOptions();
            });

            draggable(alphaSlider, function (dragX, dragY, e) {
                currentAlpha = (dragX / alphaWidth);
                isEmpty = false;
                if (e.shiftKey) {
                    currentAlpha = Math.round(currentAlpha * 10) / 10;
                }

                move();
            }, dragStart, dragStop);

            draggable(slider, function (dragX, dragY) {
                currentHue = parseFloat(dragY / slideHeight);
                isEmpty = false;
                if (!opts.showAlpha) {
                    currentAlpha = 1;
                }
                move();
            }, dragStart, dragStop);

            draggable(dragger, function (dragX, dragY, e) {

                // shift+drag should snap the movement to either the x or y axis.
                if (!e.shiftKey) {
                    shiftMovementDirection = null;
                }
                else if (!shiftMovementDirection) {
                    var oldDragX = currentSaturation * dragWidth;
                    var oldDragY = dragHeight - (currentValue * dragHeight);
                    var furtherFromX = Math.abs(dragX - oldDragX) > Math.abs(dragY - oldDragY);

                    shiftMovementDirection = furtherFromX ? "x" : "y";
                }

                var setSaturation = !shiftMovementDirection || shiftMovementDirection === "x";
                var setValue = !shiftMovementDirection || shiftMovementDirection === "y";

                if (setSaturation) {
                    currentSaturation = parseFloat(dragX / dragWidth);
                }
                if (setValue) {
                    currentValue = parseFloat((dragHeight - dragY) / dragHeight);
                }

                isEmpty = false;
                if (!opts.showAlpha) {
                    currentAlpha = 1;
                }

                move();

            }, dragStart, dragStop);

            if (!!initialColor) {
                set(initialColor);

                // In case color was black - update the preview UI and set the format
                // since the set function will not run (default color is black).
                updateUI();
                currentPreferredFormat = opts.preferredFormat || tinycolor(initialColor).format;

                addColorToSelectionPalette(initialColor);
            }
            else {
                updateUI();
            }

            if (flat) {
                show();
            }

            function paletteElementClick(e) {
                if (e.data && e.data.ignore) {
                    set($(e.target).closest(".sp-thumb-el").data("color"));
                    move();
                }
                else {
                    set($(e.target).closest(".sp-thumb-el").data("color"));
                    move();

                    // If the picker is going to close immediately, a palette selection
                    // is a change.  Otherwise, it's a move only.
                    if (opts.hideAfterPaletteSelect) {
                        updateOriginalInput(true);
                        hide();
                    } else {
                        updateOriginalInput();
                    }
                }

                return false;
            }

            var paletteEvent = IE ? "mousedown.spectrum" : "click.spectrum touchstart.spectrum";
            paletteContainer.on(paletteEvent, ".sp-thumb-el", paletteElementClick);
            initialColorContainer.on(paletteEvent, ".sp-thumb-el:nth-child(1)", { ignore: true }, paletteElementClick);
        }

        function updateSelectionPaletteFromStorage() {

            if (localStorageKey && window.localStorage) {

                // Migrate old palettes over to new format.  May want to remove this eventually.
                try {
                    var oldPalette = window.localStorage[localStorageKey].split(",#");
                    if (oldPalette.length > 1) {
                        delete window.localStorage[localStorageKey];
                        $.each(oldPalette, function(i, c) {
                             addColorToSelectionPalette(c);
                        });
                    }
                }
                catch(e) { }

                try {
                    selectionPalette = window.localStorage[localStorageKey].split(";");
                }
                catch (e) { }
            }
        }

        function addColorToSelectionPalette(color) {
            if (showSelectionPalette) {
                var rgb = tinycolor(color).toRgbString();
                if (!paletteLookup[rgb] && $.inArray(rgb, selectionPalette) === -1) {
                    selectionPalette.push(rgb);
                    while(selectionPalette.length > maxSelectionSize) {
                        selectionPalette.shift();
                    }
                }

                if (localStorageKey && window.localStorage) {
                    try {
                        window.localStorage[localStorageKey] = selectionPalette.join(";");
                    }
                    catch(e) { }
                }
            }
        }

        function getUniqueSelectionPalette() {
            var unique = [];
            if (opts.showPalette) {
                for (var i = 0; i < selectionPalette.length; i++) {
                    var rgb = tinycolor(selectionPalette[i]).toRgbString();

                    if (!paletteLookup[rgb]) {
                        unique.push(selectionPalette[i]);
                    }
                }
            }

            return unique.reverse().slice(0, opts.maxSelectionSize);
        }

        function drawPalette() {

            var currentColor = get();

            var html = $.map(paletteArray, function (palette, i) {
                return paletteTemplate(palette, currentColor, "sp-palette-row sp-palette-row-" + i, opts);
            });

            updateSelectionPaletteFromStorage();

            if (selectionPalette) {
                html.push(paletteTemplate(getUniqueSelectionPalette(), currentColor, "sp-palette-row sp-palette-row-selection", opts));
            }

            paletteContainer.html(html.join(""));
        }

        function drawInitial() {
            if (opts.showInitial) {
                var initial = colorOnShow;
                var current = get();
                initialColorContainer.html(paletteTemplate([initial, current], current, "sp-palette-row-initial", opts));
            }
        }

        function dragStart() {
            if (dragHeight <= 0 || dragWidth <= 0 || slideHeight <= 0) {
                reflow();
            }
            isDragging = true;
            container.addClass(draggingClass);
            shiftMovementDirection = null;
            boundElement.trigger('dragstart.spectrum', [ get() ]);
        }

        function dragStop() {
            isDragging = false;
            container.removeClass(draggingClass);
            boundElement.trigger('dragstop.spectrum', [ get() ]);
        }

        function setFromTextInput() {

            var value = textInput.val();

            if ((value === null || value === "") && allowEmpty) {
                set(null);
                move();
                updateOriginalInput();
            }
            else {
                var tiny = tinycolor(value);
                if (tiny.isValid()) {
                    set(tiny);
                    move();
                    updateOriginalInput();
                }
                else {
                    textInput.addClass("sp-validation-error");
                }
            }
        }

        function toggle() {
            if (visible) {
                hide();
            }
            else {
                show();
            }
        }

        function show() {
            var event = $.Event('beforeShow.spectrum');

            if (visible) {
                reflow();
                return;
            }

            boundElement.trigger(event, [ get() ]);

            if (callbacks.beforeShow(get()) === false || event.isDefaultPrevented()) {
                return;
            }

            hideAll();
            visible = true;

            $(doc).on("keydown.spectrum", onkeydown);
            $(doc).on("click.spectrum", clickout);
            $(window).on("resize.spectrum", resize);
            replacer.addClass("sp-active");
            container.removeClass("sp-hidden");

            reflow();
            updateUI();

            colorOnShow = get();

            drawInitial();
            callbacks.show(colorOnShow);
            boundElement.trigger('show.spectrum', [ colorOnShow ]);
        }

        function onkeydown(e) {
            // Close on ESC
            if (e.keyCode === 27) {
                hide();
            }
        }

        function clickout(e) {
            // Return on right click.
            if (e.button == 2) { return; }

            // If a drag event was happening during the mouseup, don't hide
            // on click.
            if (isDragging) { return; }

            if (clickoutFiresChange) {
                updateOriginalInput(true);
            }
            else {
                revert();
            }
            hide();
        }

        function hide() {
            // Return if hiding is unnecessary
            if (!visible || flat) { return; }
            visible = false;

            $(doc).off("keydown.spectrum", onkeydown);
            $(doc).off("click.spectrum", clickout);
            $(window).off("resize.spectrum", resize);

            replacer.removeClass("sp-active");
            container.addClass("sp-hidden");

            callbacks.hide(get());
            boundElement.trigger('hide.spectrum', [ get() ]);
        }

        function revert() {
            set(colorOnShow, true);
            updateOriginalInput(true);
        }

        function set(color, ignoreFormatChange) {
            if (tinycolor.equals(color, get())) {
                // Update UI just in case a validation error needs
                // to be cleared.
                updateUI();
                return;
            }

            var newColor, newHsv;
            if (!color && allowEmpty) {
                isEmpty = true;
            } else {
                isEmpty = false;
                newColor = tinycolor(color);
                newHsv = newColor.toHsv();

                currentHue = (newHsv.h % 360) / 360;
                currentSaturation = newHsv.s;
                currentValue = newHsv.v;
                currentAlpha = newHsv.a;
            }
            updateUI();

            if (newColor && newColor.isValid() && !ignoreFormatChange) {
                currentPreferredFormat = opts.preferredFormat || newColor.getFormat();
            }
        }

        function get(opts) {
            opts = opts || { };

            if (allowEmpty && isEmpty) {
                return null;
            }

            return tinycolor.fromRatio({
                h: currentHue,
                s: currentSaturation,
                v: currentValue,
                a: Math.round(currentAlpha * 1000) / 1000
            }, { format: opts.format || currentPreferredFormat });
        }

        function isValid() {
            return !textInput.hasClass("sp-validation-error");
        }

        function move() {
            updateUI();

            callbacks.move(get());
            boundElement.trigger('move.spectrum', [ get() ]);
        }

        function updateUI() {

            textInput.removeClass("sp-validation-error");

            updateHelperLocations();

            // Update dragger background color (gradients take care of saturation and value).
            var flatColor = tinycolor.fromRatio({ h: currentHue, s: 1, v: 1 });
            dragger.css("background-color", flatColor.toHexString());

            // Get a format that alpha will be included in (hex and names ignore alpha)
            var format = currentPreferredFormat;
            if (currentAlpha < 1 && !(currentAlpha === 0 && format === "name")) {
                if (format === "hex" || format === "hex3" || format === "hex6" || format === "name") {
                    format = "rgb";
                }
            }

            var realColor = get({ format: format }),
                displayColor = '';

             //reset background info for preview element
            previewElement.removeClass("sp-clear-display");
            previewElement.css('background-color', 'transparent');

            if (!realColor && allowEmpty) {
                // Update the replaced elements background with icon indicating no color selection
                previewElement.addClass("sp-clear-display");
            }
            else {
                var realHex = realColor.toHexString(),
                    realRgb = realColor.toRgbString();

                // Update the replaced elements background color (with actual selected color)
                if (rgbaSupport || realColor.alpha === 1) {
                    previewElement.css("background-color", realRgb);
                }
                else {
                    previewElement.css("background-color", "transparent");
                    previewElement.css("filter", realColor.toFilter());
                }

                if (opts.showAlpha) {
                    var rgb = realColor.toRgb();
                    rgb.a = 0;
                    var realAlpha = tinycolor(rgb).toRgbString();
                    var gradient = "linear-gradient(left, " + realAlpha + ", " + realHex + ")";

                    if (IE) {
                        alphaSliderInner.css("filter", tinycolor(realAlpha).toFilter({ gradientType: 1 }, realHex));
                    }
                    else {
                        alphaSliderInner.css("background", "-webkit-" + gradient);
                        alphaSliderInner.css("background", "-moz-" + gradient);
                        alphaSliderInner.css("background", "-ms-" + gradient);
                        // Use current syntax gradient on unprefixed property.
                        alphaSliderInner.css("background",
                            "linear-gradient(to right, " + realAlpha + ", " + realHex + ")");
                    }
                }

                displayColor = realColor.toString(format);
            }

            // Update the text entry input as it changes happen
            if (opts.showInput) {
                textInput.val(displayColor);
            }

            if (opts.showPalette) {
                drawPalette();
            }

            drawInitial();
        }

        function updateHelperLocations() {
            var s = currentSaturation;
            var v = currentValue;

            if(allowEmpty && isEmpty) {
                //if selected color is empty, hide the helpers
                alphaSlideHelper.hide();
                slideHelper.hide();
                dragHelper.hide();
            }
            else {
                //make sure helpers are visible
                alphaSlideHelper.show();
                slideHelper.show();
                dragHelper.show();

                // Where to show the little circle in that displays your current selected color
                var dragX = s * dragWidth;
                var dragY = dragHeight - (v * dragHeight);
                dragX = Math.max(
                    -dragHelperHeight,
                    Math.min(dragWidth - dragHelperHeight, dragX - dragHelperHeight)
                );
                dragY = Math.max(
                    -dragHelperHeight,
                    Math.min(dragHeight - dragHelperHeight, dragY - dragHelperHeight)
                );
                dragHelper.css({
                    "top": dragY + "px",
                    "left": dragX + "px"
                });

                var alphaX = currentAlpha * alphaWidth;
                alphaSlideHelper.css({
                    "left": (alphaX - (alphaSlideHelperWidth / 2)) + "px"
                });

                // Where to show the bar that displays your current selected hue
                var slideY = (currentHue) * slideHeight;
                slideHelper.css({
                    "top": (slideY - slideHelperHeight) + "px"
                });
            }
        }

        function updateOriginalInput(fireCallback) {
            var color = get(),
                displayColor = '',
                hasChanged = !tinycolor.equals(color, colorOnShow);

            if (color) {
                displayColor = color.toString(currentPreferredFormat);
                // Update the selection palette with the current color
                addColorToSelectionPalette(color);
            }

            if (isInput) {
                boundElement.val(displayColor);
            }

            if (fireCallback && hasChanged) {
                callbacks.change(color);
                boundElement.trigger('change', [ color ]);
            }
        }

        function reflow() {
            if (!visible) {
                return; // Calculations would be useless and wouldn't be reliable anyways
            }
            dragWidth = dragger.width();
            dragHeight = dragger.height();
            dragHelperHeight = dragHelper.height();
            slideWidth = slider.width();
            slideHeight = slider.height();
            slideHelperHeight = slideHelper.height();
            alphaWidth = alphaSlider.width();
            alphaSlideHelperWidth = alphaSlideHelper.width();

            if (!flat) {
                container.css("position", "absolute");
                if (opts.offset) {
                    container.offset(opts.offset);
                } else {
                    container.offset(getOffset(container, offsetElement));
                }
            }

            updateHelperLocations();

            if (opts.showPalette) {
                drawPalette();
            }

            boundElement.trigger('reflow.spectrum');
        }

        function destroy() {
            boundElement.show();
            offsetElement.off("click.spectrum touchstart.spectrum");
            container.remove();
            replacer.remove();
            spectrums[spect.id] = null;
        }

        function option(optionName, optionValue) {
            if (optionName === undefined) {
                return $.extend({}, opts);
            }
            if (optionValue === undefined) {
                return opts[optionName];
            }

            opts[optionName] = optionValue;

            if (optionName === "preferredFormat") {
                currentPreferredFormat = opts.preferredFormat;
            }
            applyOptions();
        }

        function enable() {
            disabled = false;
            boundElement.attr("disabled", false);
            offsetElement.removeClass("sp-disabled");
        }

        function disable() {
            hide();
            disabled = true;
            boundElement.attr("disabled", true);
            offsetElement.addClass("sp-disabled");
        }

        function setOffset(coord) {
            opts.offset = coord;
            reflow();
        }

        initialize();

        var spect = {
            show: show,
            hide: hide,
            toggle: toggle,
            reflow: reflow,
            option: option,
            enable: enable,
            disable: disable,
            offset: setOffset,
            set: function (c) {
                set(c);
                updateOriginalInput();
            },
            get: get,
            destroy: destroy,
            container: container
        };

        spect.id = spectrums.push(spect) - 1;

        return spect;
    }

    /**
    * checkOffset - get the offset below/above and left/right element depending on screen position
    * Thanks https://github.com/jquery/jquery-ui/blob/master/ui/jquery.ui.datepicker.js
    */
    function getOffset(picker, input) {
        var extraY = 0;
        var dpWidth = picker.outerWidth();
        var dpHeight = picker.outerHeight();
        var inputHeight = input.outerHeight();
        var doc = picker[0].ownerDocument;
        var docElem = doc.documentElement;
        var viewWidth = docElem.clientWidth + $(doc).scrollLeft();
        var viewHeight = docElem.clientHeight + $(doc).scrollTop();
        var offset = input.offset();
        var offsetLeft = offset.left;
        var offsetTop = offset.top;

        offsetTop += inputHeight;

        offsetLeft -=
            Math.min(offsetLeft, (offsetLeft + dpWidth > viewWidth && viewWidth > dpWidth) ?
            Math.abs(offsetLeft + dpWidth - viewWidth) : 0);

        offsetTop -=
            Math.min(offsetTop, ((offsetTop + dpHeight > viewHeight && viewHeight > dpHeight) ?
            Math.abs(dpHeight + inputHeight - extraY) : extraY));

        return {
            top: offsetTop,
            bottom: offset.bottom,
            left: offsetLeft,
            right: offset.right,
            width: offset.width,
            height: offset.height
        };
    }

    /**
    * noop - do nothing
    */
    function noop() {

    }

    /**
    * stopPropagation - makes the code only doing this a little easier to read in line
    */
    function stopPropagation(e) {
        e.stopPropagation();
    }

    /**
    * Create a function bound to a given object
    * Thanks to underscore.js
    */
    function bind(func, obj) {
        var slice = Array.prototype.slice;
        var args = slice.call(arguments, 2);
        return function () {
            return func.apply(obj, args.concat(slice.call(arguments)));
        };
    }

    /**
    * Lightweight drag helper.  Handles containment within the element, so that
    * when dragging, the x is within [0,element.width] and y is within [0,element.height]
    */
    function draggable(element, onmove, onstart, onstop) {
        onmove = onmove || function () { };
        onstart = onstart || function () { };
        onstop = onstop || function () { };
        var doc = document;
        var dragging = false;
        var offset = {};
        var maxHeight = 0;
        var maxWidth = 0;
        var hasTouch = ('ontouchstart' in window);

        var duringDragEvents = {};
        duringDragEvents["selectstart"] = prevent;
        duringDragEvents["dragstart"] = prevent;
        duringDragEvents["touchmove mousemove"] = move;
        duringDragEvents["touchend mouseup"] = stop;

        function prevent(e) {
            if (e.stopPropagation) {
                e.stopPropagation();
            }
            if (e.preventDefault) {
                e.preventDefault();
            }
            e.returnValue = false;
        }

        function move(e) {
            if (dragging) {
                // Mouseup happened outside of window
                if (IE && doc.documentMode < 9 && !e.button) {
                    return stop();
                }

                var t0 = e.originalEvent && e.originalEvent.touches && e.originalEvent.touches[0];
                var pageX = t0 && t0.pageX || e.pageX;
                var pageY = t0 && t0.pageY || e.pageY;

                var dragX = Math.max(0, Math.min(pageX - offset.left, maxWidth));
                var dragY = Math.max(0, Math.min(pageY - offset.top, maxHeight));

                if (hasTouch) {
                    // Stop scrolling in iOS
                    prevent(e);
                }

                onmove.apply(element, [dragX, dragY, e]);
            }
        }

        function start(e) {
            var rightclick = (e.which) ? (e.which == 3) : (e.button == 2);

            if (!rightclick && !dragging) {
                if (onstart.apply(element, arguments) !== false) {
                    dragging = true;
                    maxHeight = $(element).height();
                    maxWidth = $(element).width();
                    offset = $(element).offset();

                    $(doc).on(duringDragEvents);
                    $(doc.body).addClass("sp-dragging");

                    move(e);

                    prevent(e);
                }
            }
        }

        function stop() {
            if (dragging) {
                $(doc).off(duringDragEvents);
                $(doc.body).removeClass("sp-dragging");

                // Wait a tick before notifying observers to allow the click event
                // to fire in Chrome.
                setTimeout(function() {
                    onstop.apply(element, arguments);
                }, 0);
            }
            dragging = false;
        }

        $(element).on("touchstart mousedown", start);
    }

    function throttle(func, wait, debounce) {
        var timeout;
        return function () {
            var context = this, args = arguments;
            var throttler = function () {
                timeout = null;
                func.apply(context, args);
            };
            if (debounce) clearTimeout(timeout);
            if (debounce || !timeout) timeout = setTimeout(throttler, wait);
        };
    }

    function inputTypeColorSupport() {
        return $.fn.spectrum.inputTypeColorSupport();
    }

    /**
    * Define a jQuery plugin
    */
    var dataID = "spectrum.id";
    $.fn.spectrum = function (opts, extra) {

        if (typeof opts == "string") {

            var returnValue = this;
            var args = Array.prototype.slice.call( arguments, 1 );

            this.each(function () {
                var spect = spectrums[$(this).data(dataID)];
                if (spect) {
                    var method = spect[opts];
                    if (!method) {
                        throw new Error( "Spectrum: no such method: '" + opts + "'" );
                    }

                    if (opts == "get") {
                        returnValue = spect.get();
                    }
                    else if (opts == "container") {
                        returnValue = spect.container;
                    }
                    else if (opts == "option") {
                        returnValue = spect.option.apply(spect, args);
                    }
                    else if (opts == "destroy") {
                        spect.destroy();
                        $(this).removeData(dataID);
                    }
                    else {
                        method.apply(spect, args);
                    }
                }
            });

            return returnValue;
        }

        // Initializing a new instance of spectrum
        return this.spectrum("destroy").each(function () {
            var options = $.extend({}, $(this).data(), opts);
            var spect = spectrum(this, options);
            $(this).data(dataID, spect.id);
        });
    };

    $.fn.spectrum.load = true;
    $.fn.spectrum.loadOpts = {};
    $.fn.spectrum.draggable = draggable;
    $.fn.spectrum.defaults = defaultOpts;
    $.fn.spectrum.inputTypeColorSupport = function inputTypeColorSupport() {
        if (typeof inputTypeColorSupport._cachedResult === "undefined") {
            var colorInput = $("<input type='color'/>")[0]; // if color element is supported, value will default to not null
            inputTypeColorSupport._cachedResult = colorInput.type === "color" && colorInput.value !== "";
        }
        return inputTypeColorSupport._cachedResult;
    };

    $.spectrum = { };
    $.spectrum.localization = { };
    $.spectrum.palettes = { };

    $.fn.spectrum.processNativeColorInputs = function () {
        var colorInputs = $("input[type=color]");
        if (colorInputs.length && !inputTypeColorSupport()) {
            colorInputs.spectrum({
                preferredFormat: "hex6"
            });
        }
    };

    // TinyColor v1.1.2
    // https://github.com/bgrins/TinyColor
    // Brian Grinstead, MIT License

    (function() {

    var trimLeft = /^[\s,#]+/,
        trimRight = /\s+$/,
        tinyCounter = 0,
        math = Math,
        mathRound = math.round,
        mathMin = math.min,
        mathMax = math.max,
        mathRandom = math.random;

    var tinycolor = function(color, opts) {

        color = (color) ? color : '';
        opts = opts || { };

        // If input is already a tinycolor, return itself
        if (color instanceof tinycolor) {
           return color;
        }
        // If we are called as a function, call using new instead
        if (!(this instanceof tinycolor)) {
            return new tinycolor(color, opts);
        }

        var rgb = inputToRGB(color);
        this._originalInput = color;
        this._r = rgb.r;
        this._g = rgb.g;
        this._b = rgb.b;
        this._a = rgb.a;
        this._roundA = mathRound(1000 * this._a) / 1000;
        this._format = opts.format || rgb.format;
        this._gradientType = opts.gradientType;

        // Don't let the range of [0,255] come back in [0,1].
        // Potentially lose a little bit of precision here, but will fix issues where
        // .5 gets interpreted as half of the total, instead of half of 1
        // If it was supposed to be 128, this was already taken care of by `inputToRgb`
        if (this._r < 1) { this._r = mathRound(this._r); }
        if (this._g < 1) { this._g = mathRound(this._g); }
        if (this._b < 1) { this._b = mathRound(this._b); }

        this._ok = rgb.ok;
        this._tc_id = tinyCounter++;
    };

    tinycolor.prototype = {
        isDark: function() {
            return this.getBrightness() < 128;
        },
        isLight: function() {
            return !this.isDark();
        },
        isValid: function() {
            return this._ok;
        },
        getOriginalInput: function() {
          return this._originalInput;
        },
        getFormat: function() {
            return this._format;
        },
        getAlpha: function() {
            return this._a;
        },
        getBrightness: function() {
            var rgb = this.toRgb();
            return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
        },
        setAlpha: function(value) {
            this._a = boundAlpha(value);
            this._roundA = mathRound(1000 * this._a) / 1000;
            return this;
        },
        toHsv: function() {
            var hsv = rgbToHsv(this._r, this._g, this._b);
            return { h: hsv.h * 360, s: hsv.s, v: hsv.v, a: this._a };
        },
        toHsvString: function() {
            var hsv = rgbToHsv(this._r, this._g, this._b);
            var h = mathRound(hsv.h * 360), s = mathRound(hsv.s * 100), v = mathRound(hsv.v * 100);
            return (this._a == 1) ?
              "hsv("  + h + ", " + s + "%, " + v + "%)" :
              "hsva(" + h + ", " + s + "%, " + v + "%, "+ this._roundA + ")";
        },
        toHsl: function() {
            var hsl = rgbToHsl(this._r, this._g, this._b);
            return { h: hsl.h * 360, s: hsl.s, l: hsl.l, a: this._a };
        },
        toHslString: function() {
            var hsl = rgbToHsl(this._r, this._g, this._b);
            var h = mathRound(hsl.h * 360), s = mathRound(hsl.s * 100), l = mathRound(hsl.l * 100);
            return (this._a == 1) ?
              "hsl("  + h + ", " + s + "%, " + l + "%)" :
              "hsla(" + h + ", " + s + "%, " + l + "%, "+ this._roundA + ")";
        },
        toHex: function(allow3Char) {
            return rgbToHex(this._r, this._g, this._b, allow3Char);
        },
        toHexString: function(allow3Char) {
            return '#' + this.toHex(allow3Char);
        },
        toHex8: function() {
            return rgbaToHex(this._r, this._g, this._b, this._a);
        },
        toHex8String: function() {
            return '#' + this.toHex8();
        },
        toRgb: function() {
            return { r: mathRound(this._r), g: mathRound(this._g), b: mathRound(this._b), a: this._a };
        },
        toRgbString: function() {
            return (this._a == 1) ?
              "rgb("  + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ")" :
              "rgba(" + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ", " + this._roundA + ")";
        },
        toPercentageRgb: function() {
            return { r: mathRound(bound01(this._r, 255) * 100) + "%", g: mathRound(bound01(this._g, 255) * 100) + "%", b: mathRound(bound01(this._b, 255) * 100) + "%", a: this._a };
        },
        toPercentageRgbString: function() {
            return (this._a == 1) ?
              "rgb("  + mathRound(bound01(this._r, 255) * 100) + "%, " + mathRound(bound01(this._g, 255) * 100) + "%, " + mathRound(bound01(this._b, 255) * 100) + "%)" :
              "rgba(" + mathRound(bound01(this._r, 255) * 100) + "%, " + mathRound(bound01(this._g, 255) * 100) + "%, " + mathRound(bound01(this._b, 255) * 100) + "%, " + this._roundA + ")";
        },
        toName: function() {
            if (this._a === 0) {
                return "transparent";
            }

            if (this._a < 1) {
                return false;
            }

            return hexNames[rgbToHex(this._r, this._g, this._b, true)] || false;
        },
        toFilter: function(secondColor) {
            var hex8String = '#' + rgbaToHex(this._r, this._g, this._b, this._a);
            var secondHex8String = hex8String;
            var gradientType = this._gradientType ? "GradientType = 1, " : "";

            if (secondColor) {
                var s = tinycolor(secondColor);
                secondHex8String = s.toHex8String();
            }

            return "progid:DXImageTransform.Microsoft.gradient("+gradientType+"startColorstr="+hex8String+",endColorstr="+secondHex8String+")";
        },
        toString: function(format) {
            var formatSet = !!format;
            format = format || this._format;

            var formattedString = false;
            var hasAlpha = this._a < 1 && this._a >= 0;
            var needsAlphaFormat = !formatSet && hasAlpha && (format === "hex" || format === "hex6" || format === "hex3" || format === "name");

            if (needsAlphaFormat) {
                // Special case for "transparent", all other non-alpha formats
                // will return rgba when there is transparency.
                if (format === "name" && this._a === 0) {
                    return this.toName();
                }
                return this.toRgbString();
            }
            if (format === "rgb") {
                formattedString = this.toRgbString();
            }
            if (format === "prgb") {
                formattedString = this.toPercentageRgbString();
            }
            if (format === "hex" || format === "hex6") {
                formattedString = this.toHexString();
            }
            if (format === "hex3") {
                formattedString = this.toHexString(true);
            }
            if (format === "hex8") {
                formattedString = this.toHex8String();
            }
            if (format === "name") {
                formattedString = this.toName();
            }
            if (format === "hsl") {
                formattedString = this.toHslString();
            }
            if (format === "hsv") {
                formattedString = this.toHsvString();
            }

            return formattedString || this.toHexString();
        },

        _applyModification: function(fn, args) {
            var color = fn.apply(null, [this].concat([].slice.call(args)));
            this._r = color._r;
            this._g = color._g;
            this._b = color._b;
            this.setAlpha(color._a);
            return this;
        },
        lighten: function() {
            return this._applyModification(lighten, arguments);
        },
        brighten: function() {
            return this._applyModification(brighten, arguments);
        },
        darken: function() {
            return this._applyModification(darken, arguments);
        },
        desaturate: function() {
            return this._applyModification(desaturate, arguments);
        },
        saturate: function() {
            return this._applyModification(saturate, arguments);
        },
        greyscale: function() {
            return this._applyModification(greyscale, arguments);
        },
        spin: function() {
            return this._applyModification(spin, arguments);
        },

        _applyCombination: function(fn, args) {
            return fn.apply(null, [this].concat([].slice.call(args)));
        },
        analogous: function() {
            return this._applyCombination(analogous, arguments);
        },
        complement: function() {
            return this._applyCombination(complement, arguments);
        },
        monochromatic: function() {
            return this._applyCombination(monochromatic, arguments);
        },
        splitcomplement: function() {
            return this._applyCombination(splitcomplement, arguments);
        },
        triad: function() {
            return this._applyCombination(triad, arguments);
        },
        tetrad: function() {
            return this._applyCombination(tetrad, arguments);
        }
    };

    // If input is an object, force 1 into "1.0" to handle ratios properly
    // String input requires "1.0" as input, so 1 will be treated as 1
    tinycolor.fromRatio = function(color, opts) {
        if (typeof color == "object") {
            var newColor = {};
            for (var i in color) {
                if (color.hasOwnProperty(i)) {
                    if (i === "a") {
                        newColor[i] = color[i];
                    }
                    else {
                        newColor[i] = convertToPercentage(color[i]);
                    }
                }
            }
            color = newColor;
        }

        return tinycolor(color, opts);
    };

    // Given a string or object, convert that input to RGB
    // Possible string inputs:
    //
    //     "red"
    //     "#f00" or "f00"
    //     "#ff0000" or "ff0000"
    //     "#ff000000" or "ff000000"
    //     "rgb 255 0 0" or "rgb (255, 0, 0)"
    //     "rgb 1.0 0 0" or "rgb (1, 0, 0)"
    //     "rgba (255, 0, 0, 1)" or "rgba 255, 0, 0, 1"
    //     "rgba (1.0, 0, 0, 1)" or "rgba 1.0, 0, 0, 1"
    //     "hsl(0, 100%, 50%)" or "hsl 0 100% 50%"
    //     "hsla(0, 100%, 50%, 1)" or "hsla 0 100% 50%, 1"
    //     "hsv(0, 100%, 100%)" or "hsv 0 100% 100%"
    //
    function inputToRGB(color) {

        var rgb = { r: 0, g: 0, b: 0 };
        var a = 1;
        var ok = false;
        var format = false;

        if (typeof color == "string") {
            color = stringInputToObject(color);
        }

        if (typeof color == "object") {
            if (color.hasOwnProperty("r") && color.hasOwnProperty("g") && color.hasOwnProperty("b")) {
                rgb = rgbToRgb(color.r, color.g, color.b);
                ok = true;
                format = String(color.r).substr(-1) === "%" ? "prgb" : "rgb";
            }
            else if (color.hasOwnProperty("h") && color.hasOwnProperty("s") && color.hasOwnProperty("v")) {
                color.s = convertToPercentage(color.s);
                color.v = convertToPercentage(color.v);
                rgb = hsvToRgb(color.h, color.s, color.v);
                ok = true;
                format = "hsv";
            }
            else if (color.hasOwnProperty("h") && color.hasOwnProperty("s") && color.hasOwnProperty("l")) {
                color.s = convertToPercentage(color.s);
                color.l = convertToPercentage(color.l);
                rgb = hslToRgb(color.h, color.s, color.l);
                ok = true;
                format = "hsl";
            }

            if (color.hasOwnProperty("a")) {
                a = color.a;
            }
        }

        a = boundAlpha(a);

        return {
            ok: ok,
            format: color.format || format,
            r: mathMin(255, mathMax(rgb.r, 0)),
            g: mathMin(255, mathMax(rgb.g, 0)),
            b: mathMin(255, mathMax(rgb.b, 0)),
            a: a
        };
    }


    // Conversion Functions
    // --------------------

    // `rgbToHsl`, `rgbToHsv`, `hslToRgb`, `hsvToRgb` modified from:
    // <http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript>

    // `rgbToRgb`
    // Handle bounds / percentage checking to conform to CSS color spec
    // <http://www.w3.org/TR/css3-color/>
    // *Assumes:* r, g, b in [0, 255] or [0, 1]
    // *Returns:* { r, g, b } in [0, 255]
    function rgbToRgb(r, g, b){
        return {
            r: bound01(r, 255) * 255,
            g: bound01(g, 255) * 255,
            b: bound01(b, 255) * 255
        };
    }

    // `rgbToHsl`
    // Converts an RGB color value to HSL.
    // *Assumes:* r, g, and b are contained in [0, 255] or [0, 1]
    // *Returns:* { h, s, l } in [0,1]
    function rgbToHsl(r, g, b) {

        r = bound01(r, 255);
        g = bound01(g, 255);
        b = bound01(b, 255);

        var max = mathMax(r, g, b), min = mathMin(r, g, b);
        var h, s, l = (max + min) / 2;

        if(max == min) {
            h = s = 0; // achromatic
        }
        else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch(max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }

            h /= 6;
        }

        return { h: h, s: s, l: l };
    }

    // `hslToRgb`
    // Converts an HSL color value to RGB.
    // *Assumes:* h is contained in [0, 1] or [0, 360] and s and l are contained [0, 1] or [0, 100]
    // *Returns:* { r, g, b } in the set [0, 255]
    function hslToRgb(h, s, l) {
        var r, g, b;

        h = bound01(h, 360);
        s = bound01(s, 100);
        l = bound01(l, 100);

        function hue2rgb(p, q, t) {
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        if(s === 0) {
            r = g = b = l; // achromatic
        }
        else {
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return { r: r * 255, g: g * 255, b: b * 255 };
    }

    // `rgbToHsv`
    // Converts an RGB color value to HSV
    // *Assumes:* r, g, and b are contained in the set [0, 255] or [0, 1]
    // *Returns:* { h, s, v } in [0,1]
    function rgbToHsv(r, g, b) {

        r = bound01(r, 255);
        g = bound01(g, 255);
        b = bound01(b, 255);

        var max = mathMax(r, g, b), min = mathMin(r, g, b);
        var h, s, v = max;

        var d = max - min;
        s = max === 0 ? 0 : d / max;

        if(max == min) {
            h = 0; // achromatic
        }
        else {
            switch(max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: h, s: s, v: v };
    }

    // `hsvToRgb`
    // Converts an HSV color value to RGB.
    // *Assumes:* h is contained in [0, 1] or [0, 360] and s and v are contained in [0, 1] or [0, 100]
    // *Returns:* { r, g, b } in the set [0, 255]
     function hsvToRgb(h, s, v) {

        h = bound01(h, 360) * 6;
        s = bound01(s, 100);
        v = bound01(v, 100);

        var i = math.floor(h),
            f = h - i,
            p = v * (1 - s),
            q = v * (1 - f * s),
            t = v * (1 - (1 - f) * s),
            mod = i % 6,
            r = [v, q, p, p, t, v][mod],
            g = [t, v, v, q, p, p][mod],
            b = [p, p, t, v, v, q][mod];

        return { r: r * 255, g: g * 255, b: b * 255 };
    }

    // `rgbToHex`
    // Converts an RGB color to hex
    // Assumes r, g, and b are contained in the set [0, 255]
    // Returns a 3 or 6 character hex
    function rgbToHex(r, g, b, allow3Char) {

        var hex = [
            pad2(mathRound(r).toString(16)),
            pad2(mathRound(g).toString(16)),
            pad2(mathRound(b).toString(16))
        ];

        // Return a 3 character hex if possible
        if (allow3Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1)) {
            return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0);
        }

        return hex.join("");
    }
        // `rgbaToHex`
        // Converts an RGBA color plus alpha transparency to hex
        // Assumes r, g, b and a are contained in the set [0, 255]
        // Returns an 8 character hex
        function rgbaToHex(r, g, b, a) {

            var hex = [
                pad2(convertDecimalToHex(a)),
                pad2(mathRound(r).toString(16)),
                pad2(mathRound(g).toString(16)),
                pad2(mathRound(b).toString(16))
            ];

            return hex.join("");
        }

    // `equals`
    // Can be called with any tinycolor input
    tinycolor.equals = function (color1, color2) {
        if (!color1 || !color2) { return false; }
        return tinycolor(color1).toRgbString() == tinycolor(color2).toRgbString();
    };
    tinycolor.random = function() {
        return tinycolor.fromRatio({
            r: mathRandom(),
            g: mathRandom(),
            b: mathRandom()
        });
    };


    // Modification Functions
    // ----------------------
    // Thanks to less.js for some of the basics here
    // <https://github.com/cloudhead/less.js/blob/master/lib/less/functions.js>

    function desaturate(color, amount) {
        amount = (amount === 0) ? 0 : (amount || 10);
        var hsl = tinycolor(color).toHsl();
        hsl.s -= amount / 100;
        hsl.s = clamp01(hsl.s);
        return tinycolor(hsl);
    }

    function saturate(color, amount) {
        amount = (amount === 0) ? 0 : (amount || 10);
        var hsl = tinycolor(color).toHsl();
        hsl.s += amount / 100;
        hsl.s = clamp01(hsl.s);
        return tinycolor(hsl);
    }

    function greyscale(color) {
        return tinycolor(color).desaturate(100);
    }

    function lighten (color, amount) {
        amount = (amount === 0) ? 0 : (amount || 10);
        var hsl = tinycolor(color).toHsl();
        hsl.l += amount / 100;
        hsl.l = clamp01(hsl.l);
        return tinycolor(hsl);
    }

    function brighten(color, amount) {
        amount = (amount === 0) ? 0 : (amount || 10);
        var rgb = tinycolor(color).toRgb();
        rgb.r = mathMax(0, mathMin(255, rgb.r - mathRound(255 * - (amount / 100))));
        rgb.g = mathMax(0, mathMin(255, rgb.g - mathRound(255 * - (amount / 100))));
        rgb.b = mathMax(0, mathMin(255, rgb.b - mathRound(255 * - (amount / 100))));
        return tinycolor(rgb);
    }

    function darken (color, amount) {
        amount = (amount === 0) ? 0 : (amount || 10);
        var hsl = tinycolor(color).toHsl();
        hsl.l -= amount / 100;
        hsl.l = clamp01(hsl.l);
        return tinycolor(hsl);
    }

    // Spin takes a positive or negative amount within [-360, 360] indicating the change of hue.
    // Values outside of this range will be wrapped into this range.
    function spin(color, amount) {
        var hsl = tinycolor(color).toHsl();
        var hue = (mathRound(hsl.h) + amount) % 360;
        hsl.h = hue < 0 ? 360 + hue : hue;
        return tinycolor(hsl);
    }

    // Combination Functions
    // ---------------------
    // Thanks to jQuery xColor for some of the ideas behind these
    // <https://github.com/infusion/jQuery-xcolor/blob/master/jquery.xcolor.js>

    function complement(color) {
        var hsl = tinycolor(color).toHsl();
        hsl.h = (hsl.h + 180) % 360;
        return tinycolor(hsl);
    }

    function triad(color) {
        var hsl = tinycolor(color).toHsl();
        var h = hsl.h;
        return [
            tinycolor(color),
            tinycolor({ h: (h + 120) % 360, s: hsl.s, l: hsl.l }),
            tinycolor({ h: (h + 240) % 360, s: hsl.s, l: hsl.l })
        ];
    }

    function tetrad(color) {
        var hsl = tinycolor(color).toHsl();
        var h = hsl.h;
        return [
            tinycolor(color),
            tinycolor({ h: (h + 90) % 360, s: hsl.s, l: hsl.l }),
            tinycolor({ h: (h + 180) % 360, s: hsl.s, l: hsl.l }),
            tinycolor({ h: (h + 270) % 360, s: hsl.s, l: hsl.l })
        ];
    }

    function splitcomplement(color) {
        var hsl = tinycolor(color).toHsl();
        var h = hsl.h;
        return [
            tinycolor(color),
            tinycolor({ h: (h + 72) % 360, s: hsl.s, l: hsl.l}),
            tinycolor({ h: (h + 216) % 360, s: hsl.s, l: hsl.l})
        ];
    }

    function analogous(color, results, slices) {
        results = results || 6;
        slices = slices || 30;

        var hsl = tinycolor(color).toHsl();
        var part = 360 / slices;
        var ret = [tinycolor(color)];

        for (hsl.h = ((hsl.h - (part * results >> 1)) + 720) % 360; --results; ) {
            hsl.h = (hsl.h + part) % 360;
            ret.push(tinycolor(hsl));
        }
        return ret;
    }

    function monochromatic(color, results) {
        results = results || 6;
        var hsv = tinycolor(color).toHsv();
        var h = hsv.h, s = hsv.s, v = hsv.v;
        var ret = [];
        var modification = 1 / results;

        while (results--) {
            ret.push(tinycolor({ h: h, s: s, v: v}));
            v = (v + modification) % 1;
        }

        return ret;
    }

    // Utility Functions
    // ---------------------

    tinycolor.mix = function(color1, color2, amount) {
        amount = (amount === 0) ? 0 : (amount || 50);

        var rgb1 = tinycolor(color1).toRgb();
        var rgb2 = tinycolor(color2).toRgb();

        var p = amount / 100;
        var w = p * 2 - 1;
        var a = rgb2.a - rgb1.a;

        var w1;

        if (w * a == -1) {
            w1 = w;
        } else {
            w1 = (w + a) / (1 + w * a);
        }

        w1 = (w1 + 1) / 2;

        var w2 = 1 - w1;

        var rgba = {
            r: rgb2.r * w1 + rgb1.r * w2,
            g: rgb2.g * w1 + rgb1.g * w2,
            b: rgb2.b * w1 + rgb1.b * w2,
            a: rgb2.a * p  + rgb1.a * (1 - p)
        };

        return tinycolor(rgba);
    };


    // Readability Functions
    // ---------------------
    // <http://www.w3.org/TR/AERT#color-contrast>

    // `readability`
    // Analyze the 2 colors and returns an object with the following properties:
    //    `brightness`: difference in brightness between the two colors
    //    `color`: difference in color/hue between the two colors
    tinycolor.readability = function(color1, color2) {
        var c1 = tinycolor(color1);
        var c2 = tinycolor(color2);
        var rgb1 = c1.toRgb();
        var rgb2 = c2.toRgb();
        var brightnessA = c1.getBrightness();
        var brightnessB = c2.getBrightness();
        var colorDiff = (
            Math.max(rgb1.r, rgb2.r) - Math.min(rgb1.r, rgb2.r) +
            Math.max(rgb1.g, rgb2.g) - Math.min(rgb1.g, rgb2.g) +
            Math.max(rgb1.b, rgb2.b) - Math.min(rgb1.b, rgb2.b)
        );

        return {
            brightness: Math.abs(brightnessA - brightnessB),
            color: colorDiff
        };
    };

    // `readable`
    // http://www.w3.org/TR/AERT#color-contrast
    // Ensure that foreground and background color combinations provide sufficient contrast.
    // *Example*
    //    tinycolor.isReadable("#000", "#111") => false
    tinycolor.isReadable = function(color1, color2) {
        var readability = tinycolor.readability(color1, color2);
        return readability.brightness > 125 && readability.color > 500;
    };

    // `mostReadable`
    // Given a base color and a list of possible foreground or background
    // colors for that base, returns the most readable color.
    // *Example*
    //    tinycolor.mostReadable("#123", ["#fff", "#000"]) => "#000"
    tinycolor.mostReadable = function(baseColor, colorList) {
        var bestColor = null;
        var bestScore = 0;
        var bestIsReadable = false;
        for (var i=0; i < colorList.length; i++) {

            // We normalize both around the "acceptable" breaking point,
            // but rank brightness constrast higher than hue.

            var readability = tinycolor.readability(baseColor, colorList[i]);
            var readable = readability.brightness > 125 && readability.color > 500;
            var score = 3 * (readability.brightness / 125) + (readability.color / 500);

            if ((readable && ! bestIsReadable) ||
                (readable && bestIsReadable && score > bestScore) ||
                ((! readable) && (! bestIsReadable) && score > bestScore)) {
                bestIsReadable = readable;
                bestScore = score;
                bestColor = tinycolor(colorList[i]);
            }
        }
        return bestColor;
    };


    // Big List of Colors
    // ------------------
    // <http://www.w3.org/TR/css3-color/#svg-color>
    var names = tinycolor.names = {
        aliceblue: "f0f8ff",
        antiquewhite: "faebd7",
        aqua: "0ff",
        aquamarine: "7fffd4",
        azure: "f0ffff",
        beige: "f5f5dc",
        bisque: "ffe4c4",
        black: "000",
        blanchedalmond: "ffebcd",
        blue: "00f",
        blueviolet: "8a2be2",
        brown: "a52a2a",
        burlywood: "deb887",
        burntsienna: "ea7e5d",
        cadetblue: "5f9ea0",
        chartreuse: "7fff00",
        chocolate: "d2691e",
        coral: "ff7f50",
        cornflowerblue: "6495ed",
        cornsilk: "fff8dc",
        crimson: "dc143c",
        cyan: "0ff",
        darkblue: "00008b",
        darkcyan: "008b8b",
        darkgoldenrod: "b8860b",
        darkgray: "a9a9a9",
        darkgreen: "006400",
        darkgrey: "a9a9a9",
        darkkhaki: "bdb76b",
        darkmagenta: "8b008b",
        darkolivegreen: "556b2f",
        darkorange: "ff8c00",
        darkorchid: "9932cc",
        darkred: "8b0000",
        darksalmon: "e9967a",
        darkseagreen: "8fbc8f",
        darkslateblue: "483d8b",
        darkslategray: "2f4f4f",
        darkslategrey: "2f4f4f",
        darkturquoise: "00ced1",
        darkviolet: "9400d3",
        deeppink: "ff1493",
        deepskyblue: "00bfff",
        dimgray: "696969",
        dimgrey: "696969",
        dodgerblue: "1e90ff",
        firebrick: "b22222",
        floralwhite: "fffaf0",
        forestgreen: "228b22",
        fuchsia: "f0f",
        gainsboro: "dcdcdc",
        ghostwhite: "f8f8ff",
        gold: "ffd700",
        goldenrod: "daa520",
        gray: "808080",
        green: "008000",
        greenyellow: "adff2f",
        grey: "808080",
        honeydew: "f0fff0",
        hotpink: "ff69b4",
        indianred: "cd5c5c",
        indigo: "4b0082",
        ivory: "fffff0",
        khaki: "f0e68c",
        lavender: "e6e6fa",
        lavenderblush: "fff0f5",
        lawngreen: "7cfc00",
        lemonchiffon: "fffacd",
        lightblue: "add8e6",
        lightcoral: "f08080",
        lightcyan: "e0ffff",
        lightgoldenrodyellow: "fafad2",
        lightgray: "d3d3d3",
        lightgreen: "90ee90",
        lightgrey: "d3d3d3",
        lightpink: "ffb6c1",
        lightsalmon: "ffa07a",
        lightseagreen: "20b2aa",
        lightskyblue: "87cefa",
        lightslategray: "789",
        lightslategrey: "789",
        lightsteelblue: "b0c4de",
        lightyellow: "ffffe0",
        lime: "0f0",
        limegreen: "32cd32",
        linen: "faf0e6",
        magenta: "f0f",
        maroon: "800000",
        mediumaquamarine: "66cdaa",
        mediumblue: "0000cd",
        mediumorchid: "ba55d3",
        mediumpurple: "9370db",
        mediumseagreen: "3cb371",
        mediumslateblue: "7b68ee",
        mediumspringgreen: "00fa9a",
        mediumturquoise: "48d1cc",
        mediumvioletred: "c71585",
        midnightblue: "191970",
        mintcream: "f5fffa",
        mistyrose: "ffe4e1",
        moccasin: "ffe4b5",
        navajowhite: "ffdead",
        navy: "000080",
        oldlace: "fdf5e6",
        olive: "808000",
        olivedrab: "6b8e23",
        orange: "ffa500",
        orangered: "ff4500",
        orchid: "da70d6",
        palegoldenrod: "eee8aa",
        palegreen: "98fb98",
        paleturquoise: "afeeee",
        palevioletred: "db7093",
        papayawhip: "ffefd5",
        peachpuff: "ffdab9",
        peru: "cd853f",
        pink: "ffc0cb",
        plum: "dda0dd",
        powderblue: "b0e0e6",
        purple: "800080",
        rebeccapurple: "663399",
        red: "f00",
        rosybrown: "bc8f8f",
        royalblue: "4169e1",
        saddlebrown: "8b4513",
        salmon: "fa8072",
        sandybrown: "f4a460",
        seagreen: "2e8b57",
        seashell: "fff5ee",
        sienna: "a0522d",
        silver: "c0c0c0",
        skyblue: "87ceeb",
        slateblue: "6a5acd",
        slategray: "708090",
        slategrey: "708090",
        snow: "fffafa",
        springgreen: "00ff7f",
        steelblue: "4682b4",
        tan: "d2b48c",
        teal: "008080",
        thistle: "d8bfd8",
        tomato: "ff6347",
        turquoise: "40e0d0",
        violet: "ee82ee",
        wheat: "f5deb3",
        white: "fff",
        whitesmoke: "f5f5f5",
        yellow: "ff0",
        yellowgreen: "9acd32"
    };

    // Make it easy to access colors via `hexNames[hex]`
    var hexNames = tinycolor.hexNames = flip(names);


    // Utilities
    // ---------

    // `{ 'name1': 'val1' }` becomes `{ 'val1': 'name1' }`
    function flip(o) {
        var flipped = { };
        for (var i in o) {
            if (o.hasOwnProperty(i)) {
                flipped[o[i]] = i;
            }
        }
        return flipped;
    }

    // Return a valid alpha value [0,1] with all invalid values being set to 1
    function boundAlpha(a) {
        a = parseFloat(a);

        if (isNaN(a) || a < 0 || a > 1) {
            a = 1;
        }

        return a;
    }

    // Take input from [0, n] and return it as [0, 1]
    function bound01(n, max) {
        if (isOnePointZero(n)) { n = "100%"; }

        var processPercent = isPercentage(n);
        n = mathMin(max, mathMax(0, parseFloat(n)));

        // Automatically convert percentage into number
        if (processPercent) {
            n = parseInt(n * max, 10) / 100;
        }

        // Handle floating point rounding errors
        if ((math.abs(n - max) < 0.000001)) {
            return 1;
        }

        // Convert into [0, 1] range if it isn't already
        return (n % max) / parseFloat(max);
    }

    // Force a number between 0 and 1
    function clamp01(val) {
        return mathMin(1, mathMax(0, val));
    }

    // Parse a base-16 hex value into a base-10 integer
    function parseIntFromHex(val) {
        return parseInt(val, 16);
    }

    // Need to handle 1.0 as 100%, since once it is a number, there is no difference between it and 1
    // <http://stackoverflow.com/questions/7422072/javascript-how-to-detect-number-as-a-decimal-including-1-0>
    function isOnePointZero(n) {
        return typeof n == "string" && n.indexOf('.') != -1 && parseFloat(n) === 1;
    }

    // Check to see if string passed in is a percentage
    function isPercentage(n) {
        return typeof n === "string" && n.indexOf('%') != -1;
    }

    // Force a hex value to have 2 characters
    function pad2(c) {
        return c.length == 1 ? '0' + c : '' + c;
    }

    // Replace a decimal with it's percentage value
    function convertToPercentage(n) {
        if (n <= 1) {
            n = (n * 100) + "%";
        }

        return n;
    }

    // Converts a decimal to a hex value
    function convertDecimalToHex(d) {
        return Math.round(parseFloat(d) * 255).toString(16);
    }
    // Converts a hex value to a decimal
    function convertHexToDecimal(h) {
        return (parseIntFromHex(h) / 255);
    }

    var matchers = (function() {

        // <http://www.w3.org/TR/css3-values/#integers>
        var CSS_INTEGER = "[-\\+]?\\d+%?";

        // <http://www.w3.org/TR/css3-values/#number-value>
        var CSS_NUMBER = "[-\\+]?\\d*\\.\\d+%?";

        // Allow positive/negative integer/number.  Don't capture the either/or, just the entire outcome.
        var CSS_UNIT = "(?:" + CSS_NUMBER + ")|(?:" + CSS_INTEGER + ")";

        // Actual matching.
        // Parentheses and commas are optional, but not required.
        // Whitespace can take the place of commas or opening paren
        var PERMISSIVE_MATCH3 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
        var PERMISSIVE_MATCH4 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";

        return {
            rgb: new RegExp("rgb" + PERMISSIVE_MATCH3),
            rgba: new RegExp("rgba" + PERMISSIVE_MATCH4),
            hsl: new RegExp("hsl" + PERMISSIVE_MATCH3),
            hsla: new RegExp("hsla" + PERMISSIVE_MATCH4),
            hsv: new RegExp("hsv" + PERMISSIVE_MATCH3),
            hsva: new RegExp("hsva" + PERMISSIVE_MATCH4),
            hex3: /^([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
            hex6: /^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
            hex8: /^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/
        };
    })();

    // `stringInputToObject`
    // Permissive string parsing.  Take in a number of formats, and output an object
    // based on detected format.  Returns `{ r, g, b }` or `{ h, s, l }` or `{ h, s, v}`
    function stringInputToObject(color) {

        color = color.replace(trimLeft,'').replace(trimRight, '').toLowerCase();
        var named = false;
        if (names[color]) {
            color = names[color];
            named = true;
        }
        else if (color == 'transparent') {
            return { r: 0, g: 0, b: 0, a: 0, format: "name" };
        }

        // Try to match string input using regular expressions.
        // Keep most of the number bounding out of this function - don't worry about [0,1] or [0,100] or [0,360]
        // Just return an object and let the conversion functions handle that.
        // This way the result will be the same whether the tinycolor is initialized with string or object.
        var match;
        if ((match = matchers.rgb.exec(color))) {
            return { r: match[1], g: match[2], b: match[3] };
        }
        if ((match = matchers.rgba.exec(color))) {
            return { r: match[1], g: match[2], b: match[3], a: match[4] };
        }
        if ((match = matchers.hsl.exec(color))) {
            return { h: match[1], s: match[2], l: match[3] };
        }
        if ((match = matchers.hsla.exec(color))) {
            return { h: match[1], s: match[2], l: match[3], a: match[4] };
        }
        if ((match = matchers.hsv.exec(color))) {
            return { h: match[1], s: match[2], v: match[3] };
        }
        if ((match = matchers.hsva.exec(color))) {
            return { h: match[1], s: match[2], v: match[3], a: match[4] };
        }
        if ((match = matchers.hex8.exec(color))) {
            return {
                a: convertHexToDecimal(match[1]),
                r: parseIntFromHex(match[2]),
                g: parseIntFromHex(match[3]),
                b: parseIntFromHex(match[4]),
                format: named ? "name" : "hex8"
            };
        }
        if ((match = matchers.hex6.exec(color))) {
            return {
                r: parseIntFromHex(match[1]),
                g: parseIntFromHex(match[2]),
                b: parseIntFromHex(match[3]),
                format: named ? "name" : "hex"
            };
        }
        if ((match = matchers.hex3.exec(color))) {
            return {
                r: parseIntFromHex(match[1] + '' + match[1]),
                g: parseIntFromHex(match[2] + '' + match[2]),
                b: parseIntFromHex(match[3] + '' + match[3]),
                format: named ? "name" : "hex"
            };
        }

        return false;
    }

    window.tinycolor = tinycolor;
    })();

    $(function () {
        if ($.fn.spectrum.load) {
            $.fn.spectrum.processNativeColorInputs();
        }
    });

});


start()
