export const calculateFare = (distanceKm) => {
    const baseFare = 20;
    const perKmRate = 10;
    return baseFare + distanceKm * perKmRate;
  };