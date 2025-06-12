
export function Logo() {
  return (
    <div className="flex items-center justify-start group-data-[collapsible=icon]:justify-center">
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary shrink-0"
        aria-label="PennyWise Logo"
      >
        <path
          d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"
          fill="currentColor"
        />
        <path
          d="M12.5 15.66V17H11.5V15.66C10.05 15.39 9 14.2 9 12.75C9 11.13 10.23 9.89 11.82 9.76L11.55 8.5H12.45L12.71 9.72C13.06 9.79 13.38 9.93 13.66 10.13L14.41 9.25L15.09 9.87L14.33 10.74C14.73 11.23 15 11.91 15 12.75C15 14.2 13.95 15.39 12.5 15.66ZM12 10.75C11.31 10.75 10.75 11.31 10.75 12C10.75 12.69 11.31 13.25 12 13.25C12.69 13.25 13.25 12.69 13.25 12C13.25 11.31 12.69 10.75 12 10.75Z"
          fill="currentColor"
        />
      </svg>
      <span className="font-headline text-xl font-semibold text-primary ml-2 group-data-[collapsible=icon]:hidden">
        PennyWise
      </span>
    </div>
  );
}
