/* 
 * DOMParser HTML extension 
 * 2012-02-02 
 * 
 * By Eli Grey, http://eligrey.com 
 * Public domain. 
 * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK. 
 */  

/*! @source https://gist.github.com/1129031 */  
/*global document, DOMParser*/  

(function(DOMParser) {  
    "use strict";  
    var DOMParser_proto = DOMParser.prototype  
      , real_parseFromString = DOMParser_proto.parseFromString;

    // Firefox/Opera/IE throw errors on unsupported types  
    try {  
        // WebKit returns null on unsupported types  
        if ((new DOMParser).parseFromString("", "text/html")) {  
            // text/html parsing is natively supported  
            return;  
        }  
    } catch (ex) {}  

    DOMParser_proto.parseFromString = function(markup, type) {  
        if (/^\s*text\/html\s*(?:;|$)/i.test(type)) {  
            var doc = document.implementation.createHTMLDocument("")
              , doc_elt = doc.documentElement
              , first_elt;

            doc_elt.innerHTML = markup;
            first_elt = doc_elt.firstElementChild;

            if (doc_elt.childElementCount === 1
                && first_elt.localName.toLowerCase() === "html") {  
                doc.replaceChild(first_elt, doc_elt);  
            }  

            return doc;  
        } else {  
            return real_parseFromString.apply(this, arguments);  
        }  
    };  
}(DOMParser));

Fields = ['Field of Work', 'Degree', 'Other Details of the Working Conditions', 'Additional information a potential candidate may require for the Internship', 'Internship Earliest Start Date', 'Internship Latest Date', 'Minimum Duration', 'Maximum Duration', 'Excellent', 'Good', 'Basic'] // Which fields are we going to store?

function run(table)
{
//Let's get all the internships (why apply? Why not? ;)
//var table = $.apply(this, ["#tns-container table.tableClass"]);
$($(table).find("tr")[0]).remove(); //Remove Headers
$(table).find("script").remove(); //Remove useless script

//Let's create our container where we will put temporaly each internship
var container = document.createElement('div');
container.id = "container-internship";
document.body.appendChild(container);
$("#container-internship").css('display', 'none'); // We don't want to show this, so hide it.

//Now, we need to put a container with the actual content provided
var final_container = document.createElement('div');
final_container.id = "content-internships";
document.body.appendChild(final_container);

//Style baby, style.
var css = document.createElement('style');
css.innerHTML = "text/css";
css.appendChild(document.createTextNode("#content {width: 100%;} li { list-style-type: none;} .internship {width: 14%; height: 300px; overflow-y: scroll; float: left; margin: 5px; background-color: #EEE; padding: 10px;}"));
document.body.appendChild(css);

$('#content-internships').empty(); //Let's just make sure each run is clear.

Internships = []; // Our array of Internships; this is the only way to store temporaly the internships, as Chrome flushes this memory on page load
function Internship(id, tn) {this.id = id; this.tn = tn;}; // An object function to create instances of internships and store them

$(table).find('tr').each(function(index) {
	//Debuggin if to avoid getting multiple TN's many times 
	//if (index < 2) {  
	var Template = ""; //Dinamic Template;
	//Get ID and TN
	var id = $(this).find('td a.linkclass').attr('onclick').substr(8, 9);
	var tn = $(this).find('td a.linkclass').html();
	
	//Create the object!
	Internships[Internships.length] = new Internship(id, tn);
	
	$.get('http://www.myaiesec.net/exchange/viewtn.do?operation=executeAction&tnId='+Internships[index].id, function(data) {
		//Temporaly store the internship data
		$("#container-internship").html(data);
		//Get all the rows of the internship data
		var rows = $("#container-internship").find('div.container div.left-content.box tr');

	//This are the only fields we are going to retrieve in this ugly, non standard way.
	Internships[index].company = $($(rows[0]).find('font')[0]).html();
	
	//Internship Title (yikes, such an ugly way to retrieve strings)
	Internships[index].title = $($($(rows[0]).find('font')[1]).find('b')[0]).html();	
	Internships[index].group = $($(rows[0]).find('font')[2]).html();
	
	//Internship Dates (so, have you heard of CLASSES? Or maybe, you know, HTML that actually represents content).
	Internships[index].start = $($(rows[1]).find('td')).html().split(" ")[4].split("&nbsp;")[0];
	Internships[index].end = $($(rows[1]).find('td')).html().split(" ")[8];
		
	$.each(rows, function(i) { //We don't know how many rows we are going to read, so each ftw again.
		if (i>=5 && !($(rows[i]).find('td').length < 2))
		{	// Not a title and we haven't seen that data
			// Yah, I know this is O(n2), but this is the best approach for unknown rows as we may target specific field later.
			for (var j = 0; j < Fields.length; j++)
			{
				//Let's look for a specific field.
				var field = $.trim($($(rows[i]).find('td')[0]).html()).replace(/(\r\n|\n|\r)/gm,"").replace(/\s+/g," ");
				if (field == $.trim(Fields[j]))
				{
					//We found it! Get the value, which is on index 1 and store it in the internship (remember to clean up spaces in fields)
					Internships[index][Fields[j].replace(/ /gi, "_")] = $($(rows[i]).find('td')[1]).html().replace("<br>", "\n").replace(/<b>/gi, "").replace(/<\/b>/gi, ""); //Ya, too lazy to put it in one regex ;)
					//Generate dinamic template for the runtime fields
					Template = Template + "<li><b>"+Fields[j]+"</b>${"+Fields[j].replace(/ /gi, "_")+"}</li>";
				}
			}
		}		
	});
	
	
	var final_template = "<div class='internship ${id}'>\
	<li>${tn}</li>\
	<li>${company}</li>\
	<li>${title}</li>\
	<li>${group}</li>\
	<li>StartDate: ${start}</li>\
	<li>EndDate:${end}</li>\
	"+Template+"\
	</div>";
	$.tmpl(final_template, Internships[index]).appendTo( "#content-internships" );
});
	//Debuggin if to avoid getting multiple TN's many times 
	//} 
});
}

//Let's go all command pattern on this guys.
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
   if (request.state == 'onDemand')
   {
	console.log("ONDEMAND");
    loadOnDemand();
	sendResponse({data: 'Complete'});
   } else
   {
    sendResponse({data: 'Nothing...'});
   }
});

function loadOnDemand() {
//Forms Database
$('<div></div>', {id: "tns-container"}).appendTo('body');
var forms = $('html body table.container tbody tr td div.left-content.box form table.tableClass');
var Areas = forms[1]; // The first one has the search options.

// We are going to use the page's javascript to load the values in the hidden form.
$form = $('form[name="ToptenTnEpForm"]');
TN = {};


//Instead of calling the old-fashioned viewBrgPopup we will use AJAX and load it in a tab.
$(Areas).find('tr').each(function(index) {
	if (index != 0 && index < 5) // The first one has nothing.
	{
		$(this).find('td a').each(function(index) { // For each clickable TN
			
			$(this).on('click', function() {
				$form.find('input[type="hidden"]').each(function(index) {
					$t = $(this);
					TN[$t.attr('name')] = $t.val();
				});
				
				$.ajax({
				  type: "POST",
				  dataType: 'html',
				  url: "http://www.myaiesec.net/exchange/toptendemandsupply.do",
				  data: TN,
				  success: function(data) {
					try 
					{
						
						var xmlDoc = new DOMParser().parseFromString(data, 'text/html');
						run($(xmlDoc).find('html body form table.box tbody tr td table.tableClass'));
						
					}
					catch(e)
					{
						alert(e.message);
						return;
					}
				}
				  
				});
			} );
			
		});
	}
});

}


