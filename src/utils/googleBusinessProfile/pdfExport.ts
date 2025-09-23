/**
 * PDF Export Utility for Google Business Profile Overview
 *
 * Generates a PDF version of the overview page with charts and metrics
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportOptions {
  filename?: string;
  locationName?: string;
  date?: Date;
}

// Convert SVG logo to base64
async function getLogoBase64(): Promise<string> {
  try {
    // Create the SVG with the PromptReviews text logo
    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 675" width="300" height="225">
        <path d="M 51.445312 190.507812 C 50.402344 191.550781 50.390625 192.265625 50.390625 244.34375 L 50.390625 297.121094 L 51.683594 298.417969 L 52.976562 299.710938 L 80.484375 299.710938 L 81.742188 298.453125 C 83.90625 296.285156 84.25 289.71875 82.347656 286.816406 L 81.464844 285.46875 L 64.621094 285.46875 L 64.621094 203.699219 L 72.792969 203.699219 C 80.183594 203.699219 81.0625 203.597656 81.988281 202.671875 C 84.152344 200.507812 84.167969 193.0625 82.015625 190.769531 L 80.78125 189.453125 L 66.640625 189.453125 C 53.199219 189.453125 52.445312 189.507812 51.445312 190.507812 M 817.929688 190.480469 C 815.984375 192.425781 815.761719 199.589844 817.554688 202.332031 L 818.449219 203.699219 L 835.292969 203.699219 L 835.292969 285.46875 L 818.410156 285.46875 L 817.335938 287.183594 C 816.453125 288.597656 816.292969 289.605469 816.425781 292.945312 C 816.5625 296.375 816.78125 297.203125 817.863281 298.351562 L 819.136719 299.710938 L 846.941406 299.710938 L 848.234375 298.417969 L 849.527344 297.121094 L 849.527344 192.042969 L 848.234375 190.75 L 846.941406 189.453125 L 832.945312 189.453125 C 819.789062 189.453125 818.890625 189.515625 817.929688 190.480469 M 376.585938 200.53125 C 356.632812 203.003906 344.738281 217.289062 343.648438 240.097656 C 342.492188 264.390625 352.304688 280.515625 371.3125 285.542969 C 376.933594 287.03125 386.914062 287.03125 392.578125 285.542969 C 402.988281 282.808594 410.960938 276.460938 415.417969 267.367188 C 418.40625 261.265625 419.453125 256.328125 419.773438 246.792969 C 420.359375 229.265625 417.257812 218.96875 408.851562 210.535156 C 402.457031 204.121094 394.894531 200.945312 384.59375 200.351562 C 382.128906 200.207031 378.527344 200.289062 376.585938 200.53125 M 132.789062 201.589844 C 132.15625 201.847656 131.382812 202.53125 131.074219 203.113281 C 130.679688 203.84375 130.550781 216.476562 130.644531 244.152344 L 130.777344 284.136719 L 132.359375 284.933594 C 134.457031 285.988281 148.214844 285.945312 151.335938 284.871094 L 153.445312 284.144531 L 153.585938 273.015625 L 153.730469 261.882812 L 158.332031 261.566406 C 170.3125 260.742188 179.199219 255.867188 184.1875 247.386719 C 189.761719 237.90625 190.566406 225.003906 186.160156 215.683594 C 182.121094 207.140625 174.402344 202.738281 161.457031 201.589844 C 154.238281 200.953125 134.375 200.953125 132.789062 201.589844 M 240.34375 201.390625 C 239.722656 201.53125 238.773438 202.132812 238.238281 202.726562 C 237.304688 203.757812 237.253906 205.714844 237.117188 244.121094 L 236.976562 284.433594 L 238.4375 285.046875 C 240.394531 285.875 256.777344 285.878906 258.730469 285.054688 L 260.171875 284.445312 L 260.3125 270.582031 L 260.453125 256.714844 L 262.09375 256.558594 L 263.734375 256.398438 L 269.457031 269.746094 C 272.871094 277.699219 275.699219 283.574219 276.460938 284.28125 C 278.382812 286.066406 281.464844 286.734375 284.386719 285.996094 C 289.261719 284.769531 297.90625 279.054688 299.6875 275.878906 C 300.441406 274.53125 300.261719 274.15625 292.964844 261.976562 L 285.464844 249.460938 L 288.023438 247.007812 C 294.304688 240.980469 297.320312 231.570312 296.023438 222.039062 C 294.566406 211.34375 288.253906 204.984375 276.507812 202.390625 C 273.496094 201.722656 268.945312 201.476562 257.027344 201.328125 C 248.472656 201.21875 240.96875 201.25 240.34375 201.390625 M 477.898438 201.402344 C 477.171875 201.511719 475.582031 201.730469 474.363281 201.886719 C 473.140625 202.042969 471.664062 202.574219 471.082031 203.066406 C 470.058594 203.929688 469.96875 205.398438 468.625 243.488281 C 467.269531 281.8125 467.257812 283.039062 468.199219 283.726562 C 469.902344 284.972656 473.027344 285.511719 478.566406 285.511719 C 484.738281 285.511719 489.039062 284.75 490.167969 283.457031 C 490.800781 282.730469 491.070312 278.515625 491.613281 260.671875 C 491.984375 248.632812 492.4375 238.355469 492.621094 237.835938 C 492.828125 237.253906 495.691406 245.855469 500.054688 260.191406 C 503.960938 273.003906 507.429688 283.875 507.769531 284.347656 C 508.671875 285.601562 521.726562 285.617188 522.976562 284.367188 C 523.4375 283.90625 526.976562 272.984375 530.84375 260.097656 C 537.269531 238.675781 537.898438 236.871094 538.175781 239.042969 C 538.34375 240.347656 538.960938 250.902344 539.546875 262.496094 C 540.359375 278.488281 540.789062 283.746094 541.335938 284.296875 C 542.929688 285.890625 558.878906 285.992188 562.972656 284.433594 C 564.117188 284 564.347656 283.578125 564.355469 281.921875 C 564.367188 278.035156 561.140625 205.527344 560.902344 204.410156 C 560.554688 202.769531 558.257812 202.152344 550.007812 201.472656 C 541.988281 200.816406 532.8125 201.394531 529.527344 202.773438 L 527.65625 203.554688 L 523.011719 218.53125 C 520.457031 226.765625 517.773438 235.394531 517.050781 237.707031 L 515.730469 241.910156 L 509.019531 222.9375 C 502.460938 204.402344 502.265625 203.941406 500.511719 203.058594 C 497.703125 201.648438 483.277344 200.589844 477.898438 201.402344 M 615.914062 201.621094 C 615.074219 201.953125 614.277344 202.835938 613.9375 203.808594 C 613.285156 205.679688 613.128906 282.707031 613.773438 283.675781 C 613.988281 283.992188 614.753906 284.582031 615.480469 284.980469 C 617.296875 285.984375 631.746094 285.902344 634.71875 284.875 L 636.828125 284.144531 L 636.96875 273.015625 L 637.113281 261.882812 L 641.523438 261.570312 C 656.582031 260.507812 666.339844 253.21875 670.625 239.835938 C 671.746094 236.339844 671.976562 234.617188 671.964844 229.8125 C 671.929688 214.375 665.046875 205.453125 650.796875 202.371094 C 645.933594 201.320312 618.203125 200.726562 615.914062 201.621094 M 717.230469 202.101562 C 715.679688 203.65625 715.371094 205.40625 715.375 212.664062 C 715.378906 217.714844 715.589844 219.722656 716.273438 221.238281 L 717.164062 223.21875 L 732.503906 223.21875 L 732.503906 283.859375 L 733.929688 284.796875 C 735.160156 285.601562 736.640625 285.730469 744.628906 285.730469 C 752.613281 285.730469 754.097656 285.601562 755.324219 284.796875 L 756.75 283.859375 L 756.75 223.21875 L 764.121094 223.21875 C 771.179688 223.21875 771.519531 223.167969 772.265625 222.027344 C 774.097656 219.230469 774.503906 210.195312 773.050781 204.644531 C 772.050781 200.839844 773.8125 201.058594 744.589844 201.058594 C 719.085938 201.058594 718.238281 201.09375 717.230469 202.101562 M 153.707031 231.921875 L 153.707031 241.152344 L 155.707031 241.152344 C 158.375 241.152344 162.128906 239.183594 163.554688 237.039062 C 165.070312 234.753906 165.558594 230.488281 164.648438 227.445312 C 163.644531 224.066406 161.445312 222.691406 157.058594 222.691406 L 153.707031 222.691406 Z M 260.191406 231.582031 L 260.191406 240.625 L 261.675781 240.625 C 262.492188 240.625 264.34375 240.273438 265.792969 239.84375 C 269.988281 238.597656 271.964844 235.808594 271.960938 231.132812 C 271.953125 225.640625 269.71875 223.425781 263.601562 222.855469 L 260.191406 222.535156 Z M 637.09375 231.921875 L 637.09375 241.152344 L 638.804688 241.140625 C 640.957031 241.128906 644.378906 239.574219 645.886719 237.925781 C 647.523438 236.140625 648.160156 234.132812 648.160156 230.78125 C 648.160156 225.023438 645.808594 222.691406 640.007812 222.691406 L 637.09375 222.691406 Z M 376.820312 224.855469 C 375.585938 225.464844 373.949219 226.710938 373.175781 227.625 C 367.394531 234.464844 366.742188 249.503906 371.878906 257.59375 C 376.355469 264.640625 386.125 264.914062 391.285156 258.132812 C 394.042969 254.511719 394.878906 250.945312 394.835938 243 C 394.796875 235.074219 393.765625 231.480469 390.496094 227.859375 C 386.753906 223.714844 381.46875 222.550781 376.820312 224.855469 M 839.777344 328.6875 C 824.945312 331.089844 813.757812 338.976562 807.910156 351.148438 C 805.046875 357.109375 804.457031 360.050781 804.519531 368.03125 C 804.585938 376.335938 805.875 382.320312 808.96875 388.730469 C 812.941406 396.945312 820.332031 403.136719 834.332031 409.964844 C 844.335938 414.84375 845.988281 416.363281 845.929688 420.613281 C 845.871094 424.960938 841.984375 426.796875 834.917969 425.8125 C 828.796875 424.960938 823.3125 422.558594 814.058594 416.675781 C 810.085938 414.148438 809.917969 414.09375 808.917969 415 C 806.105469 417.546875 802.492188 426.96875 801.609375 434.046875 C 800.535156 442.683594 802.730469 447.960938 809.453125 452.914062 C 815.589844 457.4375 822.59375 459.542969 835.167969 460.648438 C 847.160156 461.703125 858.488281 459.976562 866.71875 455.84375 C 879.304688 449.527344 886.921875 436.203125 887.824219 418.9375 C 888.460938 406.730469 885.753906 399.132812 878.046875 391.492188 C 872.402344 385.890625 869.125 383.730469 857.171875 377.722656 C 846.59375 372.410156 844.824219 371.054688 844.460938 367.980469 C 844.152344 365.394531 845.054688 363.644531 847.40625 362.269531 C 851.382812 359.945312 862.441406 361.496094 871.09375 365.59375 C 872.953125 366.472656 874.679688 367.066406 874.929688 366.914062 C 875.175781 366.761719 876.101562 365.207031 876.980469 363.464844 C 881.121094 355.25 884.320312 345.105469 884.320312 340.171875 C 884.320312 337.871094 884.089844 337.34375 882.335938 335.589844 C 880.027344 333.277344 873.621094 330.996094 865.339844 329.535156 C 859.734375 328.546875 843.878906 328.019531 839.777344 328.6875 M 681.320312 329.8125 C 674.339844 330.226562 673.125 330.808594 672.148438 334.199219 C 671.71875 335.6875 667.445312 352.808594 662.652344 372.25 C 657.859375 391.691406 653.761719 408.019531 653.550781 408.539062 C 653.335938 409.058594 651.179688 392.371094 648.746094 371.347656 C 646.3125 350.371094 644.222656 333.03125 644.101562 332.8125 C 643.511719 331.757812 640.410156 330.804688 635.800781 330.257812 C 630.492188 329.632812 607.261719 329.875 605.066406 330.578125 C 604.328125 330.816406 603.882812 331.382812 603.882812 332.085938 C 603.886719 332.707031 608.125 360.578125 613.304688 394.027344 C 620.503906 440.511719 622.933594 455.074219 623.609375 455.820312 C 625.664062 458.09375 635.375 459.539062 648.6875 459.546875 C 660.847656 459.558594 670.113281 457.863281 672.277344 455.242188 C 672.636719 454.804688 675.949219 443.261719 679.636719 429.59375 C 683.324219 415.925781 686.417969 404.824219 686.515625 404.917969 C 686.609375 405.011719 689.292969 415.625 692.480469 428.5 C 695.664062 441.375 698.511719 452.800781 698.804688 453.886719 C 699.8125 457.644531 704.65625 459.019531 718.269531 459.414062 C 731.925781 459.8125 745.117188 458.074219 748.269531 455.46875 C 749.246094 454.660156 750.714844 447.199219 760.546875 393.214844 C 768.738281 348.222656 771.558594 331.726562 771.128906 331.296875 C 768.59375 328.761719 739.023438 328.773438 733.28125 331.316406 L 731.148438 332.261719 L 725.90625 370.835938 C 723.023438 392.050781 720.515625 409.238281 720.339844 409.03125 C 720.164062 408.820312 715.925781 391.675781 710.921875 370.929688 C 705.921875 350.183594 701.503906 332.695312 701.101562 332.066406 C 699.832031 330.058594 692.066406 329.175781 681.320312 329.8125 M 18.671875 330.613281 C 14.820312 332.269531 15.050781 327.875 15.203125 396.074219 L 15.335938 457.1875 L 17.363281 458.179688 C 21.28125 460.09375 44.621094 459.910156 48.960938 457.933594 L 50.390625 457.28125 L 50.390625 414.71875 L 56.050781 414.71875 L 64.625 434.632812 C 69.34375 445.585938 73.679688 455.230469 74.265625 456.066406 C 74.855469 456.902344 76.625 458.175781 78.203125 458.902344 C 82.179688 460.722656 87.589844 460.429688 92.617188 458.125 C 99.582031 454.933594 109.449219 447.261719 111.371094 443.546875 C 112.140625 442.054688 112.042969 441.867188 101.210938 423.761719 C 95.195312 413.710938 89.957031 404.992188 89.566406 404.386719 C 88.925781 403.382812 89.027344 403.167969 90.722656 401.960938 C 96.113281 398.125 101.988281 388.878906 104.242188 380.691406 C 105.816406 374.984375 105.949219 361.433594 104.492188 356.160156 C 100.796875 342.820312 91.394531 335.089844 74.277344 331.316406 C 69.480469 330.257812 67.335938 330.160156 44.855469 329.976562 C 23.65625 329.804688 20.363281 329.886719 18.671875 330.613281 M 147.101562 330.285156 C 144.34375 331.402344 144.496094 327.972656 144.324219 392.773438 C 144.214844 435.523438 144.335938 453.546875 144.75 454.96875 C 145.136719 456.296875 145.898438 457.320312 147.015625 458 C 148.636719 458.992188 149.921875 459.027344 181.960938 459.03125 C 212.980469 459.03125 215.273438 458.96875 216.023438 458.109375 C 217.53125 456.382812 217.953125 455.007812 218.835938 448.984375 C 219.585938 443.882812 219.625 442.121094 219.109375 437.414062 C 218.710938 433.796875 218.09375 431.035156 217.335938 429.488281 L 216.175781 427.117188 L 198.382812 426.976562 L 180.59375 426.835938 L 180.59375 408.914062 L 191.792969 408.90625 C 197.957031 408.902344 203.539062 408.753906 204.203125 408.578125 C 204.867188 408.398438 205.742188 407.609375 206.148438 406.824219 C 207.316406 404.566406 208.167969 396.496094 207.851562 390.714844 C 207.53125 384.90625 206.8125 382.257812 205.347656 381.472656 C 204.800781 381.179688 199.238281 380.957031 192.488281 380.957031 L 180.59375 380.957031 L 180.59375 363.019531 L 214.902344 363.019531 L 216.128906 361.792969 C 217.824219 360.097656 218.546875 355.367188 218.535156 346.09375 C 218.523438 337.847656 217.703125 332.527344 216.183594 330.847656 C 215.234375 329.800781 214.6875 329.78125 181.695312 329.816406 C 163.257812 329.835938 147.691406 330.046875 147.101562 330.285156 M 256.4375 330.574219 C 250.242188 331.328125 248.398438 332.003906 248.8125 333.375 C 248.960938 333.867188 256.21875 361.449219 264.9375 394.671875 C 277.429688 442.265625 281.023438 455.269531 281.867188 455.984375 C 284.664062 458.359375 293.320312 459.261719 309.453125 458.863281 C 322.757812 458.535156 329.0625 457.742188 332.003906 456.023438 L 333.683594 455.042969 L 349.917969 394.390625 C 358.847656 361.03125 366.09375 333.28125 366.015625 332.71875 C 365.9375 332.117188 365.296875 331.542969 364.449219 331.320312 C 361.394531 330.507812 352.050781 329.78125 344.628906 329.78125 C 334.542969 329.78125 328.675781 330.515625 325.171875 332.210938 C 322.847656 333.332031 322.335938 333.847656 321.910156 335.488281 C 321.628906 336.558594 318.273438 354.523438 314.453125 375.414062 C 310.628906 396.308594 307.347656 413.570312 307.15625 413.78125 C 306.96875 413.992188 303.308594 396.199219 299.027344 374.242188 C 294.746094 352.28125 290.957031 333.96875 290.609375 333.546875 C 289.515625 332.222656 285.917969 330.941406 281.632812 330.351562 C 276.234375 329.605469 263.488281 329.722656 256.4375 330.574219 M 395.84375 330.558594 C 394.140625 331.753906 393 335.277344 392.53125 340.828125 C 391.699219 350.574219 393.320312 359.898438 396.105469 361.390625 C 396.710938 361.714844 400.042969 361.964844 403.800781 361.964844 L 410.421875 361.964844 L 410.421875 426.851562 L 404.394531 426.851562 C 401.082031 426.851562 397.746094 427.089844 396.988281 427.378906 C 395.023438 428.125 393.753906 431.414062 392.960938 437.796875 C 392.136719 444.453125 392.933594 452.636719 394.769531 456.394531 L 395.925781 458.769531 L 428.4375 458.90625 L 460.945312 459.039062 L 462.003906 457.691406 C 465.957031 452.660156 465.632812 432.433594 461.53125 428.328125 C 460.070312 426.867188 459.980469 426.851562 453.425781 426.851562 L 446.796875 426.851562 L 446.796875 361.964844 L 453.078125 361.964844 C 456.535156 361.964844 459.746094 361.816406 460.214844 361.636719 C 461.527344 361.132812 462.65625 358.488281 463.441406 354.09375 C 465.148438 344.515625 463.375 331.324219 460.214844 330.109375 C 459.746094 329.929688 445.320312 329.78125 428.15625 329.78125 C 401.527344 329.78125 396.789062 329.898438 395.84375 330.558594 M 500.203125 330.3125 C 499.570312 330.570312 498.796875 331.25 498.488281 331.828125 C 497.71875 333.269531 497.699219 454.980469 498.472656 456.425781 C 499.871094 459.042969 499.738281 459.03125 535.308594 459.03125 C 568.289062 459.03125 568.53125 459.023438 569.546875 457.933594 C 572.519531 454.742188 573.566406 440.03125 571.414062 431.753906 C 570.050781 426.519531 571.398438 426.851562 551.613281 426.851562 L 534.300781 426.851562 L 534.300781 408.914062 L 545.898438 408.914062 C 556.6875 408.914062 557.566406 408.84375 558.519531 407.886719 C 560.300781 406.105469 560.863281 402.785156 560.894531 393.878906 C 560.921875 385.019531 560.4375 382.496094 558.511719 381.460938 C 557.988281 381.179688 552.371094 380.957031 545.933594 380.957031 L 534.300781 380.957031 L 534.300781 363.019531 L 550.941406 363.019531 C 561.851562 363.019531 567.945312 362.820312 568.644531 362.449219 C 570.835938 361.273438 571.386719 358.628906 571.621094 348.199219 C 571.855469 337.601562 571.347656 333.421875 569.550781 331.132812 L 568.488281 329.78125 L 534.921875 329.816406 C 516.460938 329.835938 500.835938 330.058594 500.203125 330.3125 M 50.390625 376.550781 L 50.390625 390.078125 L 54.65625 389.75 C 62.96875 389.109375 67.171875 385.667969 68.378906 378.515625 C 69.214844 373.554688 68.402344 369.734375 65.886719 366.789062 C 63.585938 364.101562 60.316406 363.019531 54.511719 363.019531 L 50.390625 363.019531 Z M 50.390625 376.550781" fill="#3B82F6" />
      </svg>
    `;

    // Convert SVG to data URL
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    // Create an image and canvas to convert SVG to PNG
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 225;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve('');
        }
        URL.revokeObjectURL(svgUrl);
      };
      img.onerror = () => {
        URL.revokeObjectURL(svgUrl);
        resolve('');
      };
      img.src = svgUrl;
    });
  } catch (error) {
    console.error('Error creating logo:', error);
    return '';
  }
}

/**
 * Exports the Google Business Profile overview to PDF
 * @param elementId - The ID of the element to export
 * @param options - Export options
 */
export async function exportOverviewToPDF(
  elementId: string,
  options: ExportOptions = {}
): Promise<void> {
  const {
    filename = 'google-business-optimization-report.pdf',
    locationName = 'Business Overview',
    date = new Date()
  } = options;

  try {
    // Load the logo
    const logoBase64 = await getLogoBase64();

    // Get the element to export
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    // Show a loading state
    const loadingOverlay = document.createElement('div');
    loadingOverlay.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      ">
        <div style="
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        ">
          <div style="text-align: center;">
            <div style="
              border: 3px solid #f3f3f3;
              border-top: 3px solid #3498db;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 0 auto 10px;
            "></div>
            <p style="margin: 0; font-family: system-ui, -apple-system, sans-serif;">Generating PDF...</p>
          </div>
        </div>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    document.body.appendChild(loadingOverlay);

    // Clone the element to modify it for PDF export
    const clonedElement = element.cloneNode(true) as HTMLElement;

    // Remove any elements that shouldn't be in the PDF
    const elementsToRemove = clonedElement.querySelectorAll('.no-print, button, .pdf-hide');
    elementsToRemove.forEach(el => el.remove());

    // Temporarily append the cloned element to capture it
    clonedElement.style.position = 'absolute';
    clonedElement.style.left = '-9999px';
    clonedElement.style.top = '0';
    clonedElement.style.width = element.offsetWidth + 'px';
    document.body.appendChild(clonedElement);

    // Wait for any images to load
    await new Promise(resolve => setTimeout(resolve, 500));

    // Convert the element to canvas with better settings
    const canvas = await html2canvas(clonedElement, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      backgroundColor: '#ffffff',
      removeContainer: true
    });

    // Remove the cloned element
    document.body.removeChild(clonedElement);

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // PDF dimensions
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const margin = 15;
    const contentWidth = pageWidth - (2 * margin);
    const headerHeight = 50; // Increased to accommodate logo
    const footerHeight = 20;
    const contentAreaHeight = pageHeight - headerHeight - footerHeight;

    // Add header function
    const addHeader = (pageNum: number = 1) => {
      // Add logo (top right) - horizontal layout for text logo
      if (logoBase64) {
        const logoWidth = 45; // Width for horizontal text logo
        const logoHeight = 15; // Height proportional to width (maintaining aspect ratio)
        pdf.addImage(logoBase64, 'PNG', pageWidth - margin - logoWidth, 10, logoWidth, logoHeight);
      }

      // Add title
      pdf.setFontSize(20);
      pdf.setTextColor(33, 37, 41);
      pdf.text('Google Business Optimization Report', margin, 20);

      // Add business name and date
      pdf.setFontSize(12);
      pdf.setTextColor(66, 66, 66);
      pdf.text(locationName, margin, 28);

      pdf.setFontSize(10);
      pdf.setTextColor(108, 117, 125);
      pdf.text(date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }), margin, 34);

      // Add PromptReviews URL below the logo
      pdf.setFontSize(10);
      pdf.setTextColor(59, 130, 246); // Blue color
      const brandText = 'promptreviews.app';
      const textWidth = pdf.getTextWidth(brandText);
      pdf.textWithLink(brandText, pageWidth - margin - 45 + (45 - textWidth) / 2, 27, {
        url: 'https://promptreviews.app'
      });

      // Add a line separator
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, 40, pageWidth - margin, 40);
    };

    // Add footer function
    const addFooter = (pageNum: number, totalPages: number) => {
      pdf.setFontSize(9);
      pdf.setTextColor(128, 128, 128);

      // Page number (centered)
      pdf.text(
        `Page ${pageNum} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );

      // PromptReviews link (right)
      pdf.setTextColor(59, 130, 246);
      const footerText = 'promptreviews.app';
      const footerWidth = pdf.getTextWidth(footerText);
      pdf.textWithLink(footerText, pageWidth - margin - footerWidth, pageHeight - 10, {
        url: 'https://promptreviews.app'
      });
    };

    // Calculate how to split the content
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Define content sections (approximate heights based on typical layout)
    // We'll use a smaller height for the first page to ensure Customer Engagement starts on page 2
    const firstPageContentHeight = contentAreaHeight * 0.6; // Use only 60% of first page for overview stats
    const remainingHeight = imgHeight - firstPageContentHeight;
    const regularPageHeight = contentAreaHeight;

    // Add first page with header
    addHeader(1);

    // Add the first page content (Overview Stats only)
    if (imgHeight <= firstPageContentHeight) {
      // Everything fits on first page with room to spare
      pdf.addImage(imgData, 'PNG', margin, headerHeight + 5, imgWidth, imgHeight);
    } else {
      // Split content - Overview Stats on page 1, rest starting on page 2

      // Page 1: Overview Stats section only
      const page1Canvas = document.createElement('canvas');
      page1Canvas.width = canvas.width;
      page1Canvas.height = firstPageContentHeight * canvas.width / imgWidth;

      const ctx1 = page1Canvas.getContext('2d');
      if (ctx1) {
        ctx1.drawImage(
          canvas,
          0, 0, canvas.width, page1Canvas.height,
          0, 0, canvas.width, page1Canvas.height
        );

        const page1ImgData = page1Canvas.toDataURL('image/png');
        pdf.addImage(
          page1ImgData,
          'PNG',
          margin,
          headerHeight + 5,
          imgWidth,
          firstPageContentHeight
        );
      }

      // Calculate remaining pages needed
      let remainingSourceY = firstPageContentHeight * canvas.width / imgWidth;
      let remainingSourceHeight = canvas.height - remainingSourceY;
      let currentPage = 2;

      // Add remaining content starting from page 2
      while (remainingSourceHeight > 0) {
        pdf.addPage();
        addHeader(currentPage);

        const pageSourceHeight = Math.min(
          regularPageHeight * canvas.width / imgWidth,
          remainingSourceHeight
        );

        // Create canvas for this page
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = pageSourceHeight;

        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            canvas,
            0, remainingSourceY, canvas.width, pageSourceHeight,
            0, 0, canvas.width, pageSourceHeight
          );

          const pageImgData = pageCanvas.toDataURL('image/png');
          const pageImgHeight = pageSourceHeight * imgWidth / canvas.width;

          pdf.addImage(
            pageImgData,
            'PNG',
            margin,
            headerHeight + 5,
            imgWidth,
            Math.min(pageImgHeight, regularPageHeight)
          );
        }

        remainingSourceY += pageSourceHeight;
        remainingSourceHeight -= pageSourceHeight;
        currentPage++;
      }
    }

    // Add footers to all pages
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      addFooter(i, totalPages);
    }

    // Add a final page with branding
    pdf.addPage();

    // Center content on last page
    const lastPageCenterY = pageHeight / 2;

    // Add logo centered above the text (horizontal text logo)
    if (logoBase64) {
      const logoWidth = 60; // Larger horizontal logo on thank you page
      const logoHeight = logoWidth * (225/300); // Maintain aspect ratio from the SVG dimensions
      pdf.addImage(logoBase64, 'PNG', (pageWidth - logoWidth) / 2, lastPageCenterY - 60, logoWidth, logoHeight);
    }

    pdf.setFontSize(24);
    pdf.setTextColor(33, 37, 41);
    pdf.text('Thank You', pageWidth / 2, lastPageCenterY - 20, { align: 'center' });

    pdf.setFontSize(14);
    pdf.setTextColor(66, 66, 66);
    pdf.text('For using PromptReviews', pageWidth / 2, lastPageCenterY - 8, { align: 'center' });

    pdf.setFontSize(12);
    pdf.setTextColor(59, 130, 246);
    const websiteText = 'Visit us at promptreviews.app';
    pdf.textWithLink(
      websiteText,
      pageWidth / 2,
      lastPageCenterY + 8,
      {
        url: 'https://promptreviews.app',
        align: 'center'
      }
    );

    // Add footer to last page
    addFooter(totalPages + 1, totalPages + 1);

    // Remove loading overlay
    document.body.removeChild(loadingOverlay);

    // Save the PDF
    pdf.save(filename);

  } catch (error) {
    console.error('Error generating PDF:', error);

    // Remove loading overlay if it exists
    const overlay = document.querySelector('[style*="position: fixed"]');
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }

    throw error;
  }
}

/**
 * Alternative method using browser print functionality
 * This can provide better fidelity but less control
 */
export function exportOverviewUsingPrint(elementId: string): void {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element not found');
  }

  // Create a new window with the content
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Could not open print window');
  }

  // Clone styles
  const styles = Array.from(document.styleSheets)
    .map(styleSheet => {
      try {
        return Array.from(styleSheet.cssRules)
          .map(rule => rule.cssText)
          .join('\n');
      } catch (e) {
        // External stylesheets might throw security errors
        return '';
      }
    })
    .join('\n');

  // Write the content to the new window
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Google Business Profile Overview</title>
        <style>
          ${styles}
          @media print {
            body { margin: 0; }
            .no-print, button { display: none !important; }
          }
        </style>
      </head>
      <body>
        ${element.outerHTML}
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            }
          }
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
}