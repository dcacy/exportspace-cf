
function start() {
	// reset UI if necessary
	$('#spacesTableWrapper').hide();
	$('#annotationWrapper').hide();
	$('#navBar').hide();
	if ( $.fn.dataTable.isDataTable( '#messagesTableDataTable' ) ) {
    $('#messagesTableDataTable').DataTable().clear();
	}
	// check to see if we have already loaded the spaces
	// if ( spaceData ) {
	// 	$('#spacesTableWrapper').show();
	// 	$('#spaceWrapper').hide();
	// } else {
		$('#loadingWrapper').show();
		$.get('/getSpaces')
			.done(function(data) {
				formatSpacesTable(data);
				$('#spacesTableWrapper').show();
			})
			.fail(function(err) {
				console.log('an error occurred getting spaces:', err);
				$('#error').html('ERROR: ' + JSON.parse(err.responseText).error);
				$('#loginMessage').show();
				$('#spacesTableWrapper').hide();
				$('#navBar').hide();
			})
			.always(function() {
				$('#loadingWrapper').hide();
			});
  	// }
}


function formatSpacesTable(data) {
	if ( data.redirect ) {
		window.location.href = data.redirect;
	} else {
		var table = $('#spacesTable').DataTable( {
			data: data,
			paging: true,
			'dom':'<"bx--search-input mySearch"f>',
			language: {
				search: "_INPUT_",
				searchPlaceholder: " find spaces here"
			},
			autoWidth: false,
			order: [[ 1, 'desc' ], [0, 'asc']],
			columns: [
				{ "data": "title", "className": "bx--table-sort-v2" },
				{ "data": "updated" }
			],
			columnDefs: [
				{ "title": "Name", "targets": 0 ,render: function(data, type, row) {
					return '<a href="/exportSpace?id=' + row.id + '">' + data + '</a>';
				}},
				{ "title": "Last Updated", "targets": 1, render: function(data, type) {
					// if type is display or filter, then format the date
					if ( type === 'display' || type === 'filter') {
						return dateFormat(new Date(data), 'dd mmm yyyy h:MM:sstt');
					} else {
						// otherwise it must be for sorting so return the raw value
						return data;
					}
				}}
			]
	  	});
	}
}




$(document).ready(function(){

	start();

});
