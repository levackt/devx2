import { Encoding } from "@iov/encoding";
import MuiTypography from "@material-ui/core/Typography";
import * as React from "react";

import { useAccount, useError, useSdk } from "../../service";
import { Button, useBaseStyles} from "../../theme";

import LinearProgress from '@material-ui/core/LinearProgress';

export interface CounterProps {
  readonly contractAddress: string;
}

export interface State {
  readonly loading: boolean;
  readonly count?: string;
}

function parseQueryJson<T>(raw: Uint8Array): T {
  return JSON.parse(Encoding.fromUtf8(raw));
}

interface QueryResponse {
  readonly count: string;
}

export function Counter(props: CounterProps): JSX.Element {
  const classes = useBaseStyles();
  const { contractAddress } = props;
  const { getClient } = useSdk();
  const { setError } = useError();
  const { refreshAccount } = useAccount();

  const [state, setState] = React.useState<State>({ loading: false });

  React.useEffect(() => {
    
    setState({ loading: true });
    getClient()
      .queryContractSmart(contractAddress, { get_count: { } })
      .then(res => {
        const o = parseQueryJson<QueryResponse>(res);
        setState({ count: o.count, loading: false });
      })
      .catch(err => {
        setState({ loading: false });
        if (!err.toString().includes("Failed to get counter")) {
          setError(err);
        }
      });
  }, [getClient, setError, contractAddress]);

  const increment = async (): Promise<boolean> => {
    
    setState({ loading: true });
    try {
      await getClient().execute(
        props.contractAddress,
        { increment: { } },
      );
      setState({ loading: false });
      refreshAccount();
      
      await getClient().queryContractSmart(contractAddress, { get_count: { } })
      .then(res => {
        const o = parseQueryJson<QueryResponse>(res);
        setState({ count: o.count, loading: false });
      })
      .catch(err => {
        setState({ loading: false });
        if (!err.toString().includes("Failed to get counter")) {
          setError(err);
        }
      });

    } catch (err) {
      setState({ loading: false });
      setError(err);
    }
    return true;
  };

  return (
    <div className={classes.card}>
      <MuiTypography className={classes.isFree} variant="h6">
        
        Counter: {state.loading ? <LinearProgress /> : state.count}
      </MuiTypography>
      <Button color="primary" type="submit" onClick={increment} disabled={state.loading}>
        Increment
      </Button>
    </div>
  );
}
