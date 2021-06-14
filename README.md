# About
A simulation if a distributed system to apply the BigTable concepts which has three major components: 
- One Master Server
- Two Tablet Servers
- Many Clients

## One Master Server
- Responsible for dividing data tables into tablets
    - Checks locality requirements for better efficiency
- Responsible for assigning tablets to tablet servers
    - Ensures load balance
- Has Metadata table indicating the row key range (start key-end key) for each tablet server

## Two Tablet Servers
- Each tablet server is responsible for a group of data tablets
- The exact number of tablets in each tablet server is according to the data size
- Performs the operations requested by the client
- Periodically each tablet server writes its tablets to the original data tables

## Many Clients
- Each client caches Metadata table (tablet locations).
- Requesting queries on data, these queries include:
    - ```Set()```: write cells in a row
    - ```DeleteCells()```: delete certain cells in a row
    - ```DeleteRow()```: delete a row
    - ```AddRow()```: add a new row
    - ```ReadRows()```: read a whole row

## Tools
- [Nodejs](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/)
- [Socket.IO](https://socket.io/)
- [IMDb Movies](https://www.kaggle.com/trentpark/imdb-data?select=IMDb+movies.csv)
