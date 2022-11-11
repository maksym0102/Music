const formatLength = (length: number, total?: number) => {
  const onlyOne = total === undefined;

  if (total === undefined) {
    total = length;
  }

  let totalSecs = (total % 60).toString();
  const totalMins = Math.floor(total / 60).toString();

  if (totalSecs.length === 1) {
    totalSecs = `0${totalSecs}`;
  }

  if (onlyOne) {
    return [`${totalMins}:${totalSecs}`];
  }

  let secs = (length % 60).toString();
  let mins = Math.floor(length / 60).toString();
  while (mins.length < totalMins.length) {
    mins = `0${mins}`;
  }
  if (secs.length === 1) {
    secs = `0${secs}`;
  }
  return [`${mins}:${secs}`, `${totalMins}:${totalSecs}`];
};

export default formatLength;
