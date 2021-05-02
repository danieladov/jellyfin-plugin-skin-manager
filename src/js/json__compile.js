function add__option() {
    window.new_chq_no = parseInt($('#total_chq').val()) + 1;
    window.new_input = "<h3>Categorie Name</h3><input type='text' id='cat_name'><div id='op_cont'><div class='inner'><h4>option name</h4><input type='text' id='op_name'><h4>option type</h4><input type='text' id='op_type'><h4>option description</h4><input type='text' id='op_desc'><h4>option css</h4><input type='text' id='op_css'></div><input type='button' value='Add a new option'></div>";

    $('#cat').append(new_input);

    $('#total_chq').val(new_chq_no);
}

function create_option_json() {
    var option__name = document.querySelectorAll('#op_name');
    option__name.forEach(option__name => function() {
        var json__options = {
            "categories": [{
                "name": "Default",
                "options": [{
                    "name": name
                }]
            }]
        }
    })

    var categories = {}
}

function no__option() {
    $('#no_op').on('click', function() {
        var json__options = {
            "categories": [{
                "name": "Default",
                "options": []
            }]
        }
    })
}

function createJSON() {
    var name = document.getElementById("name").value;
    var author = document.getElementById("author").value;
    var desc = document.getElementById("desc").value;
    var CSS = document.getElementById("css").value;
    var login = document.getElementById("login").value;
    var home = document.getElementById("home").value;
    var lib = document.getElementById("lib").value;
    var title = document.getElementById("title").value;
    var json__compiled = {
        "name ": name,
        "author ": author,
        "description ": desc,
        "defaultCss ": CSS,
        "previews ": [{
                "name ": "Login Page ",
                "url ": login
            },
            {
                "name ": "Home/Index Page ",
                "url ": home
            },
            {
                "name ": "Library Page ",
                "url ": lib
            },
            {
                "name ": "Title page ",
                "url ": title
            }
        ]
    }

    var json = JSON.stringify(json__compiled, null, 4);

    json = [json];
    var json__blob = new Blob(json, { type: "text/plain;charset=utf-8" });

    var isIE = false || !!document.documentMode;
    if (isIE) {
        window.navigator.msSaveBlob(json__blob, name + ".json");
    } else {
        var url = window.URL || window.webkitURL;
        link = url.createObjectURL(json__blob);
        var a = document.createElement("a");
        a.download = name + ".json";
        a.href = link;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}