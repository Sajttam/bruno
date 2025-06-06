import React from 'react';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import { useDispatch } from 'react-redux';
import { addAssertion, updateAssertion, deleteAssertion } from 'providers/ReduxStore/slices/collections';
import { sendRequest, saveRequest } from 'providers/ReduxStore/slices/collections/actions';
import AssertionRow from './AssertionRow';
import StyledWrapper from './StyledWrapper';
import Table from 'components/Table/index';
import ReorderTable from 'components/ReorderTable/index';
import { moveAssertion } from 'providers/ReduxStore/slices/collections/index';

const Assertions = ({ item, collection }) => {
  const dispatch = useDispatch();
  const assertions = item.draft ? get(item, 'draft.request.assertions') : get(item, 'request.assertions');

  const handleAddAssertion = () => {
    dispatch(
      addAssertion({
        itemUid: item.uid,
        collectionUid: collection.uid
      })
    );
  };

  const onSave = () => dispatch(saveRequest(item.uid, collection.uid));
  const handleRun = () => dispatch(sendRequest(item, collection.uid));
  const handleAssertionChange = (e, _assertion, type) => {
    const assertion = cloneDeep(_assertion);
    switch (type) {
      case 'name': {
        assertion.name = e.target.value;
        break;
      }
      case 'value': {
        assertion.value = e.target.value;
        break;
      }
      case 'enabled': {
        assertion.enabled = e.target.checked;
        break;
      }
    }
    dispatch(
      updateAssertion({
        assertion: assertion,
        itemUid: item.uid,
        collectionUid: collection.uid
      })
    );
  };

  const handleRemoveAssertion = (assertion) => {
    dispatch(
      deleteAssertion({
        assertUid: assertion.uid,
        itemUid: item.uid,
        collectionUid: collection.uid
      })
    );
  };

  const handleAssertionDrag = ({ updateReorderedItem }) => {
    dispatch(
      moveAssertion({
        collectionUid: collection.uid,
        itemUid: item.uid,
        updateReorderedItem
      })
    );
  };

  const isJsonResponse = (data) => {
    return data && typeof data === 'object' && !Array.isArray(data);
  };

  const generateAutoAssertions = ({body}) => {
    const assertions = [];

    const recurse = (value, path) => {
      if (value === null || value === undefined) return;

      if (typeof value !== 'object' || Array.isArray(value)) {
        assertions.push({
          name: path,
          value: String(value)
        });
      } else {
        for (const [key, nestedValue] of Object.entries(value)) {
          recurse(nestedValue, `${path}.${key}`);
        }
      }
    };

    recurse(body, 'res.body');

    return assertions;
  }

  const handleSmartAssertion = () => {
    const body = item?.response?.data;

    if (!body) {
      console.warn('No response body available');
      return;
    }

    const assertions = generateAutoAssertions({ body });

    for (const assertion of assertions) {
      dispatch(
        addAssertion({
          assertion: assertion,
          itemUid: item.uid,
          collectionUid: collection.uid
        })
      );
    }
  }

  return (
    <StyledWrapper className="w-full">
      <Table
        headers={[
          { name: 'Expr', accessor: 'expr', width: '30%' },
          { name: 'Operator', accessor: 'operator', width: '120px' },
          { name: 'Value', accessor: 'value', width: '30%' },
          { name: '', accessor: '', width: '15%' }
        ]}
      >
        <ReorderTable updateReorderedItem={handleAssertionDrag}>
          {assertions && assertions.length
            ? assertions.map((assertion) => {
              return (
                <tr key={assertion.uid} data-uid={assertion.uid}>
                  <td className='flex relative'>
                    <input
                      type="text"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      value={assertion.name}
                      className="mousetrap"
                      onChange={(e) => handleAssertionChange(e, assertion, 'name')}
                    />
                  </td>
                  <AssertionRow
                    key={assertion.uid}
                    assertion={assertion}
                    item={item}
                    collection={collection}
                    handleAssertionChange={handleAssertionChange}
                    handleRemoveAssertion={handleRemoveAssertion}
                    onSave={onSave}
                    handleRun={handleRun}
                  />
                </tr>
              );
            })
            : null}
        </ReorderTable>
      </Table>
      <button className="btn-add-assertion text-link pr-2 py-3 mt-2 select-none" onClick={handleAddAssertion}>
        + Add Assertion
      </button>
      <div className="mt-1">
        <button className="submit btn btn-sm btn-secondary" 
                onClick={handleSmartAssertion}
                disabled={!isJsonResponse(item?.response?.data)}>
          Auto Assertion
        </button>
      </div>
    </StyledWrapper>
  );
};
export default Assertions;
