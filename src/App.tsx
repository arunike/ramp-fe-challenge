import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoading, setIsLoading] = useState(false)
  const [isEmployeeFiltered, setIsEmployeeFiltered] = useState(false);

  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  )

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true);
    transactionsByEmployeeUtils.invalidateData()

    await employeeUtils.fetchAll()
    setIsLoading(false);
    await paginatedTransactionsUtils.fetchAll()

    // setIsLoading(false)
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData()
      
      await transactionsByEmployeeUtils.fetchById(employeeId)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  const handleEmployee = useCallback(
    async (newValue: Employee | null) => {
      setIsEmployeeFiltered(false)
      if (newValue === null) {
        return
      } else if (newValue.id === EMPTY_EMPLOYEE.id) {
        await loadAllTransactions()
      } else {
        setIsEmployeeFiltered(true)
        await loadTransactionsByEmployee(newValue.id)
      }
    }, [loadAllTransactions, loadTransactionsByEmployee])

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          // onChange={async (newValue: Employee | null) => {
          //   await loadTransactionsByEmployee(newValue.id)
          // }}
          onChange={handleEmployee}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} />

          {transactions !== null && !isEmployeeFiltered && paginatedTransactions?.nextPage !== null &&(
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading}
              onClick={async () => {
                await loadAllTransactions()
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}
