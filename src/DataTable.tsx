import { useEffect, useRef, useState } from 'react';
import { Checkbox, CheckboxChangeEvent } from 'primereact/checkbox';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import { OverlayPanel } from 'primereact/overlaypanel';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import 'primeicons/primeicons.css';

type Table = {
    id: number;
    title: string;
    place_of_origin: string;
    artist_display: string;
    inscriptions: string;
    date_start: string;
    date_end: string;
}

const TableComponent = () => {
    const [records, setRecords] = useState<Table[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [totalRecords, setTotalRecords] = useState<number>(0);
    const [first, setFirst] = useState<number>(0);
    const [selectedRows, setSelectedRows] = useState<number[]>([]); // Store selected row IDs
    const [customSelectedRows, setCustomSelectedRows] = useState<Array<{ page: number, rowsSelected: number }>>([]);
    const [deselectedRows, setDeselectedRows] = useState<number[]>([]);
    const [inputRowCount, setInputRowCount] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const rowsPerPage = 12;

    const over = useRef<OverlayPanel>(null);

    const fetchData = async (page: number) => {
        setLoading(true);
        setCurrentPage(page);
        const url = `https://api.artic.edu/api/v1/artworks?page=${page}&limit=${rowsPerPage}`;

        try {
            const response = await fetch(url);
            const json = await response.json();
            setRecords(json.data);
            setTotalRecords(json.pagination.total);
        } catch (error) {
            console.log('Error is:', error);
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        const currentPage = Math.floor(first / rowsPerPage) + 1;
        fetchData(currentPage);
    }, [first]);

    const onPageChange = (event: { first: number; rows: number }) => {
        setFirst(event.first);
    };


    const handleRowSelection = (rowData: Table) => {
        setSelectedRows(prevSelectedRows => {
            const isSelected = prevSelectedRows.includes(rowData.id);
            if (isSelected) {
                setDeselectedRows(prevDeselectedRows => {
                    const newDeselectedRows = new Set(prevDeselectedRows);
                    newDeselectedRows.add(rowData.id);
                    return Array.from(newDeselectedRows);
                });
                // Remove from selected rows
                return prevSelectedRows.filter(id => id !== rowData.id);
            } else {
                setDeselectedRows(prevDeselectedRows => {
                    return prevDeselectedRows.filter(id => id !== rowData.id);
                });
                // Add to selected rows
                return [...prevSelectedRows, rowData.id];
            }
        });
    };


    const handleSelectAll = (e: CheckboxChangeEvent) => {
        setSelectedRows(e.checked ? records.map(record => record.id) : []);
    };

    const handleInputChange = (value: number) => {
        setInputRowCount(value);
    };

    const handleSubmit = () => {
        let numberOfRowsToSelect = Math.min(inputRowCount, totalRecords);
        let newCustomSelectedRows: { page: number; rowsSelected: number }[] = [];
        let cPage = currentPage;
        while (numberOfRowsToSelect > 0) {
            const rowsOnCurrentPage = Math.min(numberOfRowsToSelect, rowsPerPage);
            newCustomSelectedRows.push({ page: cPage, rowsSelected: rowsOnCurrentPage });
            numberOfRowsToSelect -= rowsOnCurrentPage;
            cPage += 1;
        }
        setCustomSelectedRows(newCustomSelectedRows as [{ page: number; rowsSelected: number }]);
        over.current?.hide();
    };

    const isSelected = (rowId: number) => selectedRows.includes(rowId);


    useEffect(() => {
        if (!loading) {
            if (customSelectedRows !== undefined) {
                let customRowNumberToSelectForPage = customSelectedRows?.find(page => page.page === currentPage)?.rowsSelected ?? 0;

                if (customRowNumberToSelectForPage > 0) {

                    // Get the filtered records, excluding deselectedRows
                    const filteredRecords = records
                        .filter(record => !deselectedRows.includes(record.id)) // Exclude deselectedRows
                        .map(record => record.id);

                    // Only add ids that are not already in selectedRows
                    const uniqueFilteredRecords = filteredRecords
                        .filter(id => !selectedRows.includes(id))
                        .slice(0, customRowNumberToSelectForPage);

                    setSelectedRows([...selectedRows, ...uniqueFilteredRecords]);

                    setCustomSelectedRows(prevCustomSelectedRows =>
                        prevCustomSelectedRows.filter(page => page.page !== currentPage)
                    );
                }
            }
        }

    }, [currentPage, customSelectedRows, deselectedRows, records, selectedRows]);

    return (
        <div>
            <DataTable value={records} loading={loading}>
                <Column
                    header={
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Checkbox
                                onChange={handleSelectAll}
                                checked={records.length > 0 && selectedRows.length === records.length &&
                                    selectedRows.every(selectedRow =>
                                        records.some(record => record.id === selectedRow)
                                    )
                                }
                            />
                            <i
                                className="pi pi-chevron-down"
                                style={{ cursor: 'pointer', marginLeft: '10px', fontSize: '1.5rem' }}
                                onClick={(e) => over.current?.toggle(e)}
                            />
                            <OverlayPanel ref={over} showCloseIcon>
                                <div style={{ padding: '1rem' }}>
                                    <h3>Select Number of Rows</h3>
                                    <InputNumber
                                        value={inputRowCount}
                                        onValueChange={(e) => handleInputChange(e.value || 0)}
                                        min={0}
                                        max={totalRecords}
                                    />
                                    <Button label="Submit" onClick={handleSubmit} className="mt-2" style={{ display: 'block', width: '200px' }} />
                                </div>
                            </OverlayPanel>
                        </div>
                    }
                    body={(rowData: Table) => (
                        <Checkbox
                            checked={isSelected(rowData.id)}
                            onChange={() => handleRowSelection(rowData)}
                        />
                    )}
                    style={{ width: '3em' }}
                />
                <Column field="title" header="Title"></Column>
                <Column field="place_of_origin" header="Place of Origin"></Column>
                <Column field="artist_display" header="Artist"></Column>
                <Column field="inscriptions" header="Inscriptions"></Column>
                <Column field="date_start" header="Start Date"></Column>
                <Column field="date_end" header="End Date"></Column>
            </DataTable>
            <Paginator
                first={first}
                rows={rowsPerPage}
                totalRecords={totalRecords}
                onPageChange={onPageChange}
            />
        </div>
    );
};

export default TableComponent;
