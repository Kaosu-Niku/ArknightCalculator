import $ from "jquery";

export const createTableLanguage = (t) => ({
  processing: t("數據載入中，請稍候..."),
  lengthMenu: t("顯示 _MENU_ 項結果"),
  zeroRecords: t("沒有符合的結果"),
  info: t("顯示第 _START_ 至 _END_ 項結果，共 _TOTAL_ 項"),
  infoEmpty: t("顯示第 0 至 0 項結果，共 0 項"),
  infoFiltered: t("(從 _MAX_ 項結果中過濾)"),
  search: t("搜尋:"),
  paginate: {
    first: t("首頁"),
    previous: t("上一頁"),
    next: t("下一頁"),
    last: t("末頁"),
  },
});

export const initializeDataTable = ({
  tableRef,
  data,
  columns,
  order = [[0, 'asc']],
  t,
}) => {
  destroyDataTable(tableRef);

  return $(tableRef.current).DataTable({
    data,
    pageLength: 20,
    processing: true,
    language: createTableLanguage(t),
    columns,
    order,
  });
};

export const destroyDataTable = (tableRef) => {
  const tableElement = tableRef.current;
  if(!tableElement){
    return;
  }

  if($.fn.dataTable.isDataTable(tableElement)){
    $(tableElement).DataTable().destroy();
  }

  $(tableElement).empty();
};
