// Client CRM Application Flow Diagram
// This diagram illustrates the data flow between UI components, store, and database

/**
 * @mermaid
 * flowchart TB
    %% Define styles
    classDef component fill:#d4f1f9,stroke:#05a,stroke-width:1px
    classDef store fill:#ffe6cc,stroke:#d79b00,stroke-width:1px
    classDef database fill:#e1d5e7,stroke:#9673a6,stroke-width:1px
    
    %% UI Components
    UI[UI Components]:::component
    ClientForm[Client Form]:::component
    CompanyForm[Company Form]:::component
    ClientList[Client List]:::component
    CompanyList[Company List]:::component
    ClientDetail[Client Detail]:::component
    CompanyDetail[Company Detail]:::component
    Dashboard[Dashboard]:::component
    CompanySelector[Company Selector]:::component
    
    %% Store Slices
    Store[Zustand Store]:::store
    ClientStore[Client Store Slice]:::store
    CompanyStore[Company Store Slice]:::store
    InteractionStore[Interaction Store Slice]:::store
    ErrorStore[Error Store Slice]:::store
    
    %% Database
    DB[(IndexedDB)]:::database
    ClientsTable[(Clients Table)]:::database
    CompaniesTable[(Companies Table)]:::database
    InteractionsTable[(Interactions Table)]:::database
    NotesTable[(Notes Table)]:::database
    
    %% Connections - UI to Store
    UI --> Store
    ClientForm --> ClientStore
    CompanyForm --> CompanyStore
    ClientList --> ClientStore
    CompanyList --> CompanyStore
    ClientDetail --> ClientStore
    ClientDetail --> InteractionStore
    CompanyDetail --> CompanyStore
    CompanyDetail --> ClientStore
    Dashboard --> ClientStore
    Dashboard --> CompanyStore
    Dashboard --> InteractionStore
    CompanySelector --> CompanyStore
    
    %% Store Structure
    Store --> ClientStore
    Store --> CompanyStore
    Store --> InteractionStore
    Store --> ErrorStore
    
    %% Store to Database
    ClientStore -- "CRUD Operations" --> ClientsTable
    CompanyStore -- "CRUD Operations" --> CompaniesTable
    InteractionStore -- "CRUD Operations" --> InteractionsTable
    InteractionStore -- "CRUD Operations" --> NotesTable
    
    %% Database Structure
    DB --> ClientsTable
    DB --> CompaniesTable
    DB --> InteractionsTable
    DB --> NotesTable
    
    %% Foreign Key Relationships
    ClientsTable -. "companyId FK" .-> CompaniesTable
    InteractionsTable -. "clientId FK" .-> ClientsTable
    NotesTable -. "clientId FK" .-> ClientsTable
    
    %% Subgraph for UI Components
    subgraph UI Components
        ClientForm
        CompanyForm
        ClientList
        CompanyList
        ClientDetail
        CompanyDetail
        Dashboard
        CompanySelector
    end
    
    %% Subgraph for Store
    subgraph Zustand Store
        ClientStore
        CompanyStore
        InteractionStore
        ErrorStore
    end
    
    %% Subgraph for Database
    subgraph IndexedDB
        ClientsTable
        CompaniesTable
        InteractionsTable
        NotesTable
    end
 */

/**
 * @mermaid
 * sequenceDiagram
    %% Participants
    participant User
    participant UI as UI Component
    participant Store as Zustand Store
    participant DB as IndexedDB
    
    %% Client Creation Flow
    User->>UI: Fill client form
    UI->>Store: createClient()
    Store->>DB: addClient()
    DB-->>Store: Return client ID
    Store-->>UI: Update state
    UI-->>User: Show success message
    
    %% Company Creation Flow
    User->>UI: Fill company form
    UI->>Store: createCompany()
    Store->>DB: addCompany()
    DB-->>Store: Return company ID
    Store-->>UI: Update state
    UI-->>User: Show success message
    
    %% Client with Company Flow
    User->>UI: Fill client form with company
    UI->>Store: createClientWithCompany()
    Store->>Store: Check if company exists
    alt Company exists
        Store->>DB: addClient() with companyId
    else Company doesn't exist
        Store->>DB: addCompany()
        DB-->>Store: Return company ID
        Store->>DB: addClient() with new companyId
    end
    DB-->>Store: Return client ID
    Store-->>UI: Update state
    UI-->>User: Show success message
    
    %% Fetching Data Flow
    User->>UI: Navigate to dashboard
    UI->>Store: fetchClients(), fetchCompanies()
    Store->>DB: getAllClients(), getAllCompanies()
    DB-->>Store: Return data
    Store-->>UI: Update state
    UI-->>User: Display data
    
    %% Delete Company Flow
    User->>UI: Request delete company
    UI->>Store: fetchCompanyWithClients()
    Store->>DB: getCompanyWithClients()
    DB-->>Store: Return company with clients
    alt Has associated clients
        Store-->>UI: Cannot delete (has clients)
        UI-->>User: Show error message
    else No associated clients
        UI->>User: Confirm deletion
        User->>UI: Confirm
        UI->>Store: removeCompany()
        Store->>DB: deleteCompany()
        DB-->>Store: Confirm deletion
        Store-->>UI: Update state
        UI-->>User: Show success message
    end
 */